<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminSectionNav from '../components/admin/AdminSectionNav.vue'
import { getAdminReturns, updateAdminReturn } from '../services/adminReturnService'

const entries = ref([])
const drafts = ref({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const filter = ref('')
let active = true

const labels = {
  REQUESTED: 'Solicitud recibida',
  IN_REVIEW: 'En revisión',
  AWAITING_ITEMS: 'Pendiente de recibir las prendas',
  RECEIVED: 'Prendas recibidas',
  CLOSED: 'Finalizada',
  REJECTED: 'No aceptada',
}
const transitions = {
  REQUESTED: ['IN_REVIEW', 'AWAITING_ITEMS', 'REJECTED'],
  IN_REVIEW: ['AWAITING_ITEMS', 'REJECTED'],
  AWAITING_ITEMS: ['RECEIVED'],
  RECEIVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
}
const visible = computed(() => entries.value.filter(entry =>
  !filter.value || entry.request.status === filter.value,
))
const choices = status => [status, ...(transitions[status] || [])]
const date = value => new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

const draftFor = entry => ({
  status: entry.request.status,
  note: entry.request.adminNote || '',
})

const load = async () => {
  if (saving.value) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const data = await getAdminReturns()
    if (!active) return
    entries.value = data
    drafts.value = Object.fromEntries(data.map(entry =>
      [entry.request.id, draftFor(entry)],
    ))
  } catch {
    if (active) error.value = 'No se pudieron cargar las devoluciones. Comprueba tu sesión y vuelve a intentarlo.'
  } finally {
    if (active) loading.value = false
  }
}

const save = async entry => {
  if (saving.value || loading.value) return
  error.value = ''
  message.value = ''
  const id = entry.request.id
  const draft = drafts.value[id]
  const note = draft.note.trim()

  if (['CLOSED', 'REJECTED'].includes(draft.status) && !note) {
    error.value = 'Explica el motivo o la resolución antes de finalizar o rechazar.'
    return
  }

  saving.value = true
  try {
    const result = await updateAdminReturn(id, draft.status, note)
    if (!active) return
    entries.value = entries.value.map(item => item.request.id === id ? result : item)
    drafts.value[id] = draftFor(result)
    message.value = `Solicitud #${id} actualizada. El cliente verá la respuesta en su pedido.`
  } catch (failure) {
    if (active) error.value = failure.response?.status === 409
      ? 'La solicitud ha cambiado o ese paso no está permitido. Actualiza la lista.'
      : 'No se pudo guardar la respuesta. Inténtalo de nuevo.'
  } finally {
    if (active) saving.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { active = false })
</script>

<template>
  <main class="workspace-page workspace-admin">
    <AdminSectionNav />
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1>Devoluciones</h1>
      <button type="button" :disabled="loading || saving" class="border border-black px-4 py-2" @click="load">
        Actualizar solicitudes
      </button>
    </div>

    <p class="mt-4 text-sm text-gray-600">
      Revisa las prendas y responde al cliente. Finalizar una solicitud no realiza
      un reembolso ni repone el stock automáticamente.
    </p>

    <label for="return-filter" class="mt-6 block">Mostrar</label>
    <select id="return-filter" v-model="filter" class="mt-2">
      <option value="">Todas las solicitudes</option>
      <option v-for="(label, status) in labels" :key="status" :value="status">{{ label }}</option>
    </select>

    <p v-if="error" role="alert" class="mt-5 text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="mt-5 text-green-800">{{ message }}</p>
    <p v-if="loading" role="status" class="mt-6">Cargando solicitudes…</p>
    <p v-else-if="!visible.length && !error" class="mt-6">No hay devoluciones en este apartado.</p>

    <div v-if="!loading" class="mt-8 grid gap-6">
      <article v-for="entry in visible" :key="entry.request.id" class="border p-6">
        <div class="flex flex-wrap justify-between gap-4">
          <div>
            <h2>Solicitud #{{ entry.request.id }}</h2>
            <p class="mt-2">{{ entry.customerName }}</p>
            <p class="break-all text-sm text-gray-600">{{ entry.customerEmail }}</p>
            <time :datetime="entry.request.createdAt" class="mt-2 block text-sm">
              {{ date(entry.request.createdAt) }}
            </time>
          </div>
          <p>{{ labels[entry.request.status] }}</p>
        </div>

        <p class="mt-4">Pedido #{{ entry.request.orderId }}</p>
        <ul class="mt-4 space-y-2">
          <li v-for="item in entry.request.items" :key="item.lineIndex">
            {{ item.productName }} · Talla {{ item.size === 'TU' ? 'Única' : item.size }}
            · {{ item.quantity }} ud.
          </li>
        </ul>
        <p v-if="entry.request.note" class="mt-4 whitespace-pre-wrap">{{ entry.request.note }}</p>

        <form class="mt-6" @submit.prevent="save(entry)">
          <fieldset :disabled="saving">
            <label :for="`return-status-${entry.request.id}`" class="block">Estado</label>
            <select :id="`return-status-${entry.request.id}`" v-model="drafts[entry.request.id].status" class="mt-2 w-full">
              <option v-for="status in choices(entry.request.status)" :key="status" :value="status">
                {{ labels[status] }}
              </option>
            </select>

            <label :for="`return-response-${entry.request.id}`" class="mt-5 block">
              Respuesta para el cliente
            </label>
            <textarea
              :id="`return-response-${entry.request.id}`"
              v-model="drafts[entry.request.id].note"
              maxlength="2000"
              rows="3"
              class="mt-2 w-full"
              :required="['CLOSED', 'REJECTED'].includes(drafts[entry.request.id].status)"
            />

            <button type="submit" class="mt-4 border border-black bg-black px-5 py-3">
              {{ saving ? 'Guardando…' : 'Guardar estado y respuesta' }}
            </button>
          </fieldset>
        </form>
      </article>
    </div>
    <RouterLink to="/account" class="mt-8 inline-block underline">Volver al panel</RouterLink>
  </main>
</template>
