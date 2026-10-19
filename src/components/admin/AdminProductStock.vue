<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['save'])
const quantities = reactive({})
const error = ref('')

watch(() => props.product, (product) => {
  Object.keys(quantities).forEach((key) => delete quantities[key])
  Object.assign(quantities, product.stockBySize)
  error.value = ''
}, { immediate: true })

function submit() {
  if (props.disabled) return
  const stock = {}
  for (const [size, quantity] of Object.entries(quantities)) {
    const value = Number(quantity)
    if (quantity === '' || !Number.isInteger(value) || value < 0 || value > 2147483647) {
      error.value = 'Indica unidades enteras, iguales o mayores que cero.'
      return
    }
    stock[size] = value
  }
  error.value = ''
  emit('save', { productId: props.product.id, stockBySize: stock })
}
</script>

<template>
  <form class="mt-5 border-t border-black/20 pt-5" @submit.prevent="submit">
    <fieldset :disabled="disabled">
      <legend class="font-bold">Stock por talla</legend>
      <p class="mt-2 text-sm">
        Indica las unidades disponibles. Con cero unidades, la talla queda agotada.
      </p>
      <div class="mt-4 flex flex-wrap gap-4">
        <label v-for="(_, size) in quantities" :key="size" class="block">
          <span class="block text-sm">
            {{ size === 'TU' ? 'Talla única' : size }}
          </span>
          <input
            v-model="quantities[size]"
            type="number"
            required
            min="0"
            max="2147483647"
            step="1"
            :aria-label="`Unidades de ${product.name}, talla ${size === 'TU' ? 'única' : size}`"
            class="mt-2 w-24 border border-black/40 bg-transparent p-2"
          />
        </label>
      </div>
      <p v-if="error" role="alert" class="mt-3 text-red-700">{{ error }}</p>
      <button
        type="submit"
        class="mt-4 bg-black px-4 py-2 text-white disabled:opacity-40"
      >
        Guardar stock
      </button>
    </fieldset>
  </form>
</template>
