<script setup>
import { reactive, ref, watch } from 'vue'
import AdminImagePicker from './AdminImagePicker.vue'

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'cancel'])
const uploadingImage = ref(false)
const imageError = ref('')

const form = reactive({
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
})

watch(() => props.product, (product) => {
  Object.assign(form, {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    imageUrl: product?.imageUrl ?? '',
    category: product?.category ?? '',
  })
}, { immediate: true })

const submit = () => {
  if (props.disabled || uploadingImage.value) return
  imageError.value = ''
  if (!form.imageUrl) {
    imageError.value = 'Elige una imagen antes de guardar el producto.'
    return
  }
  emit('save', { ...form })
}
</script>

<template>
  <form
    class="border border-black/20 p-5 md:p-8"
    :aria-busy="disabled"
    @submit.prevent="submit"
  >
    <h2 class="text-2xl font-semibold">
      {{ product ? 'Editar prenda' : 'Nueva prenda' }}
    </h2>

    <fieldset :disabled="disabled || uploadingImage" class="mt-6 space-y-5">
      <label class="block">
        <span class="block text-sm font-bold">Nombre</span>
        <input
          v-model="form.name"
          name="name"
          required
          maxlength="100"
          class="mt-2 w-full border border-black/30 bg-transparent p-3"
        />
      </label>

      <label class="block">
        <span class="block text-sm font-bold">Descripción</span>
        <textarea
          v-model="form.description"
          name="description"
          required
          maxlength="2000"
          rows="4"
          class="mt-2 w-full border border-black/30 bg-transparent p-3"
        />
      </label>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block">
          <span class="block text-sm font-bold">Precio (€)</span>
          <input
            v-model="form.price"
            name="price"
            type="number"
            required
            min="0"
            max="99999999.99"
            step="0.01"
            class="mt-2 w-full border border-black/30 bg-transparent p-3"
          />
        </label>

        <label class="block">
          <span class="block text-sm font-bold">Categoría</span>
          <input
            v-model="form.category"
            name="category"
            required
            maxlength="100"
            class="mt-2 w-full border border-black/30 bg-transparent p-3"
          />
        </label>
      </div>

      <AdminImagePicker
        v-model="form.imageUrl"
        :disabled="disabled || uploadingImage"
        @busy="uploadingImage = $event"
      />
      <p v-if="imageError" role="alert" class="text-red-700">
        {{ imageError }}
      </p>
    </fieldset>

    <p v-if="!product" class="mt-5 text-sm text-black/70">
      Las prendas nuevas empiezan sin stock. Las tallas y unidades se
      configuran por separado.
    </p>

    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="submit"
        :disabled="disabled || uploadingImage"
        class="border-2 border-black bg-black px-5 py-3 font-bold text-white disabled:opacity-40"
      >
        {{ uploadingImage ? 'Subiendo imagen…' : disabled ? 'Guardando…' : 'Guardar producto' }}
      </button>

      <button
        type="button"
        :disabled="disabled || uploadingImage"
        class="border border-black px-5 py-3 disabled:opacity-40"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>
