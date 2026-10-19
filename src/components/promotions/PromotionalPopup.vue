<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getActivePopup } from '../../services/popupService'

const route = useRoute()
const popup = ref(null)
const dialog = ref(null)
const codeInput = ref(null)
const copyMessage = ref('')
let controller
let request = 0
let alive = true

watch(() => route.fullPath, async () => {
  const current = ++request
  controller?.abort()
  dialog.value?.close()
  popup.value = null
  copyMessage.value = ''
  if (!['/', '/shop'].includes(route.path)) return

  controller = new AbortController()
  try {
    const result = await getActivePopup(controller.signal)
    if (!alive || current !== request || !result) return
    popup.value = result
    await nextTick()
    if (alive && current === request && !dialog.value?.open) {
      dialog.value?.showModal()
    }
  } catch {
    // Si el anuncio no está disponible, la web sigue funcionando.
  }
}, { immediate: true, flush: 'post' })

async function copyCode() {
  const code = popup.value?.promoCode
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copyMessage.value = '¡Código copiado! Pégalo al finalizar tu compra.'
  } catch {
    codeInput.value?.focus()
    codeInput.value?.select()
    copyMessage.value = 'Selecciona y copia el código para usarlo al finalizar tu compra.'
  }
}

onBeforeUnmount(() => {
  alive = false
  request += 1
  controller?.abort()
  dialog.value?.close()
})
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="promotion-title"
    aria-describedby="promotion-text"
    class="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto border border-black/20 bg-white p-6 text-black shadow-xl backdrop:bg-black/55 sm:p-10"
  >
    <template v-if="popup">
      <div class="flex justify-end">
        <button
          type="button"
          autofocus
          class="px-2 py-2 text-sm underline"
          @click="dialog.close()"
        >
          × Cerrar
        </button>
      </div>
      <h2 id="promotion-title" class="mt-4 text-center text-3xl font-bold">
        {{ popup.title }}
      </h2>
      <p id="promotion-text" class="mt-5 whitespace-pre-line text-center leading-relaxed">
        {{ popup.text }}
      </p>
      <div v-if="popup.promoCode" class="mt-6">
        <label class="block text-center text-sm" for="promotion-code">
          Tu código de descuento
        </label>
        <input
          id="promotion-code"
          ref="codeInput"
          :value="popup.promoCode"
          readonly
          class="mt-3 w-full border border-dashed border-black bg-transparent p-4 text-center text-xl font-bold"
        />
        <button type="button" class="mt-4 w-full bg-black px-5 py-3 text-white" @click="copyCode">
          Copiar código
        </button>
        <p class="mt-3 text-center text-sm" role="status">{{ copyMessage }}</p>
      </div>
    </template>
  </dialog>
</template>
