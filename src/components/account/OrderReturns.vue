<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getOrderReturns, createReturnRequest } from '../../services/returnService'

const props = defineProps({
  order: { type: Object, required: true },
})

const requests = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const opened = ref(false)
const quantities = ref({})
const note = ref('')
const pending = ref(null)
let active = true

const labels = {
  REQUESTED: 'Solicitud recibida',
  IN_REVIEW: 'En revisión',
  AWAITING_ITEMS: 'Pendiente de recibir las prendas',
  RECEIVED: 'Prendas recibidas',
  CLOSED: 'Finalizada',
  REJECTED: 'No aceptada',
}

const available = computed(() =>
  props.order.items.map((item, lineIndex) => {
    const used = requests.value
      .filter(request => request.status !== 'REJECTED')
      .flatMap(request => request.items)
      .filter(item => item.lineIndex === lineIndex)
      .reduce((total, item) => total + Number(item.quantity), 0)

    return {
      ...item,
      lineIndex,
      remaining: Math.max(0, Number(item.quantity) - used),
    }
  }),
)

const canRequest = computed(() => available.value.some(item => item.remaining > 0))
const formatDate = value => new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

const load = async () => {
  if (saving.value) return
  loading.value = true
  error.value = ''

  try {
    const result = await getOrderReturns(props.order.id)
    if (active) requests.value = result
  } catch {
    if (active) error.value = 'No se pudieron consultar las devoluciones. Inténtalo de nuevo.'
  } finally {
    if (active) loading.value = false
  }
}

const submit = async () => {
  if (saving.value || loading.value) return
  error.value = ''
  success.value = ''

  if (!pending.value) {
    const items = available.value
      .map(item => ({
        lineIndex: item.lineIndex,
        quantity: Number(quantities.value[item.lineIndex] || 0),
      }))
      .filter(item => item.quantity !== 0)

    if (!items.length || items.some(item =>
      !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > available.value[item.lineIndex].remaining,
    )) {
      error.value = 'Selecciona al menos una unidad y revisa las cantidades.'
      return
    }

    pending.value = {
      clientRequestId: crypto.randomUUID(),
      type: 'WITHDRAWAL',
      note: note.value.trim(),
      items,
    }
  }

  saving.value = true

  try {
    const result = await createReturnRequest(props.order.id, pending.value)
    if (!active) return

    requests.value = [
      result,
      ...requests.value.filter(request => request.id !== result.id),
    ]
    pending.value = null
    quantities.value = {}
    note.value = ''
    opened.value = false
    success.value = `Solicitud #${result.id} recibida. Puedes consultar su seguimiento aquí.`
  } catch (failure) {
    if (!active) return
    const status = failure.response?.status

    if (status >= 400 && status < 500 && status !== 408) {
      pending.value = null
      error.value = status === 409
        ? 'La selección ya no está disponible. Actualiza las solicitudes y revisa las unidades.'
        : [401, 403].includes(status)
          ? 'Inicia sesión de nuevo para solicitar la devolución.'
          : 'No se pudo enviar la solicitud. Revisa los datos.'
    } else {
      error.value = 'No hemos podido confirmar el envío. Pulsa Reintentar envío para comprobar la misma solicitud sin duplicarla.'
    }
  } finally {
    if (active) saving.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { active = false })
</script>

<template>
  <section id="returns" class="order-returns" aria-labelledby="returns-heading">
    <div class="returns-heading">
      <h2 id="returns-heading">Devoluciones</h2>
      <button type="button" :disabled="loading || saving" @click="load">
        {{ loading ? 'Consultando…' : 'Actualizar solicitudes' }}
      </button>
    </div>

    <p class="returns-description">
      Selecciona las prendas que quieres devolver. No necesitas indicar un motivo.
    </p>
    <p class="returns-description">
      Si has recibido una prenda defectuosa o equivocada, escríbenos a
      <a :href="`mailto:equisibe@gmail.com?subject=Incidencia%20pedido%20${order.id}`">
        equisibe@gmail.com
      </a>
      indicando el número de pedido y adjuntando fotografías.
    </p>

    <p v-if="loading" role="status">Consultando tus solicitudes…</p>
    <p v-if="error" role="alert" class="mt-4 text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="mt-4 text-green-800">{{ success }}</p>

    <template v-if="!loading">
      <button
        v-if="!opened && !error && canRequest"
        type="button"
        class="returns-primary"
        @click="opened = true"
      >Solicitar devolución</button>

      <form v-if="opened" class="returns-form" @submit.prevent="submit">
        <fieldset :disabled="saving || !!pending">
          <legend>Unidades que quieres devolver</legend>

          <div v-for="item in available" :key="item.lineIndex" class="returns-line">
            <label :for="`return-quantity-${order.id}-${item.lineIndex}`">
              {{ item.productName }} · Talla {{ item.size === 'TU' ? 'Única' : item.size }}
              <span class="returns-remaining">{{ item.remaining }} unidades disponibles</span>
            </label>
            <input
              :id="`return-quantity-${order.id}-${item.lineIndex}`"
              v-model="quantities[item.lineIndex]"
              type="number"
              min="0"
              :max="item.remaining"
              step="1"
              :disabled="item.remaining === 0"
              placeholder="0"
            >
          </div>

          <label :for="`return-note-${order.id}`">Comentario opcional</label>
          <textarea
            :id="`return-note-${order.id}`"
            v-model="note"
            maxlength="2000"
            rows="3"
            class="mt-2 w-full"
          />
        </fieldset>

        <div class="returns-actions">
          <button type="submit" class="returns-primary" :disabled="saving || loading">
            {{ saving ? 'Enviando…' : pending ? 'Reintentar envío' : 'Enviar solicitud de devolución' }}
          </button>
          <button
            v-if="!pending"
            type="button"
            :disabled="saving"
            @click="opened = false; error = ''"
          >Cancelar</button>
        </div>
      </form>

      <ul v-if="requests.length" class="returns-history">
        <li v-for="request in requests" :key="request.id">
          <h3>Solicitud #{{ request.id }}</h3>
          <p class="returns-status">{{ labels[request.status] ?? request.status }}</p>
          <time :datetime="request.createdAt">{{ formatDate(request.createdAt) }}</time>

          <ul class="mt-4">
            <li v-for="item in request.items" :key="item.lineIndex">
              {{ item.productName }} · Talla {{ item.size === 'TU' ? 'Única' : item.size }}
              · {{ item.quantity }} ud.
            </li>
          </ul>

          <p v-if="request.note" class="mt-3 whitespace-pre-wrap">{{ request.note }}</p>
          <div v-if="request.adminNote" class="returns-response">
            <h4>Respuesta de Equisibé</h4>
            <p class="whitespace-pre-wrap">{{ request.adminNote }}</p>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.order-returns {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid #d8dddf;
  scroll-margin-top: 24px;
}
.returns-heading, .returns-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.returns-heading button, time {
  color: #53616a;
  font-size: 13px;
}
.returns-heading button { text-decoration: underline; }
.returns-description {
  margin: 16px 0;
  color: #53616a;
  font-size: 14px;
  line-height: 1.9;
}
a { text-decoration: underline; text-underline-offset: 4px; }
button.returns-primary {
  margin-top: 16px;
  padding: 12px 18px;
  border: 1px solid #c3d2d8;
  border-radius: 4px;
  background: #e2eaed;
  color: #28383f;
  font-size: 14px;
}
button.returns-primary:hover:not(:disabled) { background: #d3e0e5; }
button:disabled { opacity: .5; }
.returns-form { margin-top: 24px; }
legend { margin-bottom: 16px; font-size: 15px; }
.returns-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 80px;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.returns-line label { overflow-wrap: anywhere; }
.returns-line input { width: 100%; }
.returns-remaining {
  display: block;
  margin-top: 6px;
  color: #53616a;
  font-size: 12px;
}
.returns-history { display: grid; gap: 20px; margin-top: 28px; }
.returns-history > li {
  padding: 22px;
  border: 1px solid #d8dddf;
  border-radius: 6px;
  background: #fcfcfa;
  font-size: 14px;
  line-height: 1.9;
}
.returns-status { margin: 8px 0; color: #425963; }
.returns-response {
  margin-top: 18px;
  padding: 16px;
  border-radius: 4px;
  background: #eaf0f1;
}
.returns-response h4 { margin-bottom: 8px; }
button:focus-visible, a:focus-visible {
  outline: 2px solid #738b96;
  outline-offset: 4px;
}
</style>
