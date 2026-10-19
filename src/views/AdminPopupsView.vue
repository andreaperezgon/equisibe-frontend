<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  getAdminPopups, saveAdminPopup, setPopupActive,
  deleteAdminPopup, createPopupExamples,
} from '../services/popupService'

const popups = ref([])
const busy = ref(false)
const error = ref('')
const message = ref('')
const editingId = ref(null)
const showForm = ref(false)
const deletingId = ref(null)
const blank = () => ({ title: '', text: '', promoCode: '' })
const form = reactive(blank())
let alive = true

function describe(failure) {
  if ([401, 403].includes(failure.response?.status)) {
    popups.value = []
    showForm.value = false
    return 'Vuelve a iniciar sesión con la cuenta administradora.'
  }
  return failure.response?.status === 400
    ? 'Revisa el título, el texto y el código. Usa EQUISIBE10, EQUISIBE20 o deja el código vacío.'
    : 'No se pudo completar la operación. Actualiza la lista antes de reintentarlo.'
}

async function load() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await getAdminPopups()
    if (alive) popups.value = result
  } catch (failure) {
    if (alive) error.value = describe(failure)
  } finally {
    if (alive) busy.value = false
  }
}

function edit(popup = null) {
  if (busy.value) return
  editingId.value = popup?.id ?? null
  Object.assign(form, {
    title: popup?.title ?? '',
    text: popup?.text ?? '',
    promoCode: popup?.promoCode ?? '',
  })
  error.value = ''
  message.value = ''
  showForm.value = true
}

async function mutate(action, success) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await action()
    if (!alive) return
    showForm.value = false
    deletingId.value = null
    message.value = success
    const result = await getAdminPopups()
    if (alive) popups.value = result
  } catch (failure) {
    if (alive) error.value = describe(failure)
  } finally {
    if (alive) busy.value = false
  }
}

function save() {
  const payload = {
    title: form.title.trim(),
    text: form.text.trim(),
    promoCode: form.promoCode.trim().toUpperCase(),
  }
  return mutate(
    () => saveAdminPopup(editingId.value, payload),
    editingId.value == null
      ? 'Anuncio creado y desactivado. Actívalo cuando quieras mostrarlo.'
      : 'Anuncio actualizado.',
  )
}

onMounted(load)
onBeforeUnmount(() => { alive = false })
</script>

<template>
  <main class="mx-auto max-w-5xl px-5 py-10">
    <RouterLink to="/account" class="text-sm underline">← Volver al panel</RouterLink>
    <h1 class="mt-6 text-3xl">Popups promocionales</h1>
    <p class="mt-3">
      El anuncio activo aparece al entrar y vuelve a aparecer al cambiar de página.
      Si hay varios activos, se muestra el actualizado más recientemente.
    </p>

    <div class="my-6 flex flex-wrap gap-3">
      <button :disabled="busy" class="bg-black px-4 py-2 text-white disabled:opacity-40" @click="edit()">
        Nuevo anuncio
      </button>
      <button :disabled="busy" class="border border-black px-4 py-2 disabled:opacity-40" @click="mutate(createPopupExamples, 'Ejemplos preparados. Puedes editar el motivo y activar el que quieras.')">
        Crear ejemplos 10 % y 20 %
      </button>
      <button :disabled="busy" class="border border-black px-4 py-2 disabled:opacity-40" @click="load">
        Actualizar lista
      </button>
    </div>

    <p v-if="error" role="alert" class="my-4 text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="my-4 text-green-800">{{ message }}</p>

    <form v-if="showForm" class="my-6 border border-black/20 p-5" @submit.prevent="save">
      <h2 class="text-xl">{{ editingId == null ? 'Nuevo anuncio' : 'Editar anuncio' }}</h2>
      <fieldset :disabled="busy" class="mt-4 space-y-4">
        <label class="block">
          <span class="block">Título</span>
          <input v-model="form.title" required maxlength="120" class="mt-2 w-full border border-black/30 bg-transparent p-2" />
        </label>
        <label class="block">
          <span class="block">Texto o motivo del descuento</span>
          <textarea v-model="form.text" required maxlength="2000" rows="4" class="mt-2 w-full border border-black/30 bg-transparent p-2" />
        </label>
        <label class="block">
          <span class="block">Código para copiar</span>
          <select v-model="form.promoCode" class="mt-2 w-full border border-black/30 bg-transparent p-2">
            <option value="">Sin código</option>
            <option value="EQUISIBE10">EQUISIBE10 — 10 %</option>
            <option value="EQUISIBE20">EQUISIBE20 — 20 %</option>
          </select>
        </label>
        <div class="flex gap-3">
          <button type="submit" class="bg-black px-4 py-2 text-white">Guardar anuncio</button>
          <button type="button" class="border border-black px-4 py-2" @click="showForm = false">Cancelar</button>
        </div>
      </fieldset>
    </form>

    <p v-if="busy" role="status">Cargando…</p>
    <p v-else-if="!popups.length && !error">Todavía no hay anuncios. Puedes crear los dos ejemplos.</p>

    <ul class="mt-6 space-y-5">
      <li v-for="popup in popups" :key="popup.id" class="border border-black/20 p-5">
        <h2 class="text-xl">{{ popup.title }}</h2>
        <p class="mt-3 whitespace-pre-line">{{ popup.text }}</p>
        <p v-if="popup.promoCode" class="mt-3 font-bold">{{ popup.promoCode }}</p>
        <p class="mt-3" :class="popup.active ? 'font-bold text-green-800' : ''">
          {{ popup.active ? 'Activo' : 'Desactivado' }}
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button :disabled="busy" class="border border-black px-4 py-2" @click="edit(popup)">Editar</button>
          <button :disabled="busy" class="bg-black px-4 py-2 text-white" @click="mutate(() => setPopupActive(popup.id, !popup.active), popup.active ? 'Anuncio desactivado.' : 'Anuncio activado.')">
            {{ popup.active ? 'Desactivar' : 'Activar' }}
          </button>
          <button :disabled="busy" class="px-4 py-2 underline" @click="deletingId = popup.id">Eliminar</button>
        </div>
        <div v-if="deletingId === popup.id" class="mt-4">
          <p>¿Eliminar este anuncio definitivamente?</p>
          <button :disabled="busy" class="mr-4 mt-2 text-red-700 underline" @click="mutate(() => deleteAdminPopup(popup.id), 'Anuncio eliminado.')">Sí, eliminar</button>
          <button :disabled="busy" class="underline" @click="deletingId = null">Cancelar</button>
        </div>
      </li>
    </ul>
  </main>
</template>
