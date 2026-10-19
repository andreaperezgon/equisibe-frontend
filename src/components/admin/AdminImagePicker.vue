<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { uploadAdminProductImage } from '../../services/adminProductService'
import { productImageUrl } from '../../utils/productImage'

defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'busy'])
const uploading = ref(false)
const error = ref('')
let active = true

onBeforeUnmount(() => { active = false })

async function selectImage(event) {
  const input = event.target
  const file = input.files?.[0]
  input.value = ''
  if (!file || uploading.value) return
  error.value = ''

  if (!/\.(jpe?g|png)$/i.test(file.name) ||
      file.size > 10 * 1024 * 1024 || file.size === 0) {
    error.value = 'Elige una imagen JPG o PNG de hasta 10 MB.'
    return
  }

  uploading.value = true
  emit('busy', true)
  try {
    const result = await uploadAdminProductImage(file)
    if (active) emit('update:modelValue', result.imageUrl)
  } catch (failure) {
    if (!active) return
    error.value = [401, 403].includes(failure.response?.status)
      ? 'Vuelve a iniciar sesión con la cuenta administradora.'
      : 'No se pudo subir la imagen. Usa JPG o PNG de hasta 10 MB y 16 megapíxeles.'
  } finally {
    if (active) {
      uploading.value = false
      emit('busy', false)
    }
  }
}
</script>

<template>
  <div>
    <label class="block">
      <span class="block text-sm font-bold">Imagen del producto</span>
      <input
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        :disabled="disabled || uploading"
        class="mt-3 block w-full text-sm file:mr-4 file:border file:border-black file:bg-transparent file:px-4 file:py-2"
        @change="selectImage"
      />
    </label>
    <p class="mt-2 text-sm text-black/70">
      Elige una foto de tus archivos o galería. JPG o PNG, hasta 10 MB.
    </p>
    <p v-if="uploading" role="status" class="mt-3">Subiendo imagen…</p>
    <p v-if="error" role="alert" class="mt-3 text-red-700">{{ error }}</p>
    <img
      v-if="modelValue"
      :src="productImageUrl(modelValue)"
      alt="Vista previa de la imagen del producto"
      class="mt-4 h-56 w-44 border border-black/20 object-contain"
    />
  </div>
</template>
