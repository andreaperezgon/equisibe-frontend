<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getShopStatus, saveShopSettings } from '../../services/shopSettingsService'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const form = reactive({
  closed: false,
  title: '',
  text: '',
  countdownEnabled: false,
  countdownTarget: '',
})
let alive = true

function fill(data) {
  let date = ''
  if (data.countdownTarget) {
    const value = new Date(data.countdownTarget)
    const pad = (number) => String(number).padStart(2, '0')
    date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
  }
  Object.assign(form, {
    closed: data.closed,
    title: data.title,
    text: data.text,
    countdownEnabled: data.countdownEnabled,
    countdownTarget: date,
  })
}

async function load() {
  if (saving.value) return
  loading.value = true
  error.value = ''
  try {
    const data = await getShopStatus()
    if (alive) fill(data)
  } catch {
    if (alive) error.value = 'No se pudo cargar la configuración de Tienda.'
  } finally {
    if (alive) loading.value = false
  }
}

async function save() {
  if (saving.value || loading.value) return
  error.value = ''
  message.value = ''
  let target = null
  if (form.countdownEnabled) {
    const date = new Date(form.countdownTarget)
    if (!form.countdownTarget || Number.isNaN(date.getTime())) {
      error.value = 'Indica la fecha y hora de la cuenta atrás.'
      return
    }
    target = date.toISOString()
  }

  saving.value = true
  try {
    const data = await saveShopSettings({
      closed: form.closed,
      title: form.title.trim(),
      text: form.text.trim(),
      countdownEnabled: form.countdownEnabled,
      countdownTarget: target,
    })
    if (!alive) return
    fill(data)
    message.value = data.closed
      ? 'Tienda cerrada. El aviso se mantiene hasta que la abras manualmente.'
      : 'Tienda abierta. El catálogo y las compras están disponibles.'
  } catch {
    if (alive) error.value = 'No se pudo guardar. Revisa los campos y tu sesión de administrador.'
  } finally {
    if (alive) saving.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { alive = false })
</script>

<template>
  <section class="border border-black/25 p-5 sm:p-7">
    <h2 class="text-2xl">Apertura y cierre de Tienda</h2>
    <p class="mt-3 text-sm">
      El cierre muestra un aviso fijo sin botón para quitarlo.
      El resto de la web continúa disponible.
    </p>
    <p v-if="error" role="alert" class="mt-4 text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="mt-4 text-green-800">{{ message }}</p>
    <p v-if="loading" role="status" class="mt-4">Cargando configuración…</p>
    <button v-if="error && !saving" type="button" class="mt-3 underline" @click="load">
      Recargar configuración
    </button>

    <form v-if="!loading && form.title" class="mt-5" @submit.prevent="save">
      <fieldset :disabled="saving" class="space-y-4">
        <label class="flex items-center gap-3 font-bold">
          <input v-model="form.closed" type="checkbox" />
          Mantener Tienda cerrada
        </label>

        <label class="block">
          <span class="block">Título del aviso</span>
          <input v-model="form.title" required maxlength="120" class="mt-2 w-full border border-black/30 bg-transparent p-3" />
        </label>

        <label class="block">
          <span class="block">Texto del aviso</span>
          <textarea v-model="form.text" required maxlength="2000" rows="4" class="mt-2 w-full border border-black/30 bg-transparent p-3" />
        </label>

        <label class="flex items-center gap-3">
          <input v-model="form.countdownEnabled" type="checkbox" />
          Mostrar cuenta atrás
        </label>

        <label v-if="form.countdownEnabled" class="block">
          <span class="block">Fecha y hora de la cuenta atrás</span>
          <input v-model="form.countdownTarget" type="datetime-local" required class="mt-2 border border-black/30 bg-transparent p-3" />
        </label>

        <p class="text-sm">
          Sin cuenta atrás se muestra solo el texto. Al llegar a cero,
          Tienda sigue cerrada hasta que desmarques el cierre y guardes.
        </p>

        <button type="submit" class="bg-black px-5 py-3 text-white disabled:opacity-40">
          {{ saving ? 'Guardando…' : 'Guardar configuración de Tienda' }}
        </button>
      </fieldset>
    </form>
  </section>
</template>
