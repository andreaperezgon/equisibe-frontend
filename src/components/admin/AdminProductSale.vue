<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['save'])
const opened = ref(false)
const price = ref('')
const error = ref('')

const money = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR',
  }).format(value)

watch(() => props.product, (product) => {
  price.value = product.salePrice ?? ''
  error.value = ''
}, { immediate: true })

function save() {
  if (props.disabled) return
  const value = Number(price.value)
  if (price.value === '' || !Number.isFinite(value) ||
      value <= 0 || value >= Number(props.product.price) ||
      Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    error.value = 'Escribe un precio mayor que cero y menor que el habitual, con un máximo de dos decimales.'
    return
  }
  error.value = ''
  emit('save', { productId: props.product.id, salePrice: value })
}

function remove() {
  if (props.disabled) return
  emit('save', { productId: props.product.id, salePrice: null })
}
</script>

<template>
  <section class="mt-5 border-t border-black/20 pt-5">
    <button
      type="button"
      :disabled="disabled"
      :aria-expanded="opened"
      class="border border-black px-4 py-2 disabled:opacity-40"
      @click="opened = !opened"
    >
      {{ product.salePrice != null ? 'Editar rebaja' : 'Rebaja' }}
    </button>

    <p v-if="product.salePrice != null" class="mt-3">
      <span class="sr-only">Precio anterior:</span>
      <del>{{ money(product.price) }}</del>
      <span class="sr-only">Precio rebajado:</span>
      <strong class="ml-3 text-red-700">{{ money(product.salePrice) }}</strong>
    </p>

    <form v-if="opened" class="mt-4" @submit.prevent="save">
      <fieldset :disabled="disabled">
        <p class="text-sm">Precio habitual: {{ money(product.price) }}</p>
        <label class="mt-3 block">
          <span class="block text-sm">Precio rebajado (€)</span>
          <input
            v-model="price"
            type="number"
            required
            min="0.01"
            step="0.01"
            :aria-label="`Precio rebajado de ${product.name}`"
            class="mt-2 w-40 border border-black/40 bg-transparent p-2"
          />
        </label>
        <p v-if="error" role="alert" class="mt-3 text-red-700">{{ error }}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button type="submit" class="bg-black px-4 py-2 text-white">
            Guardar rebaja
          </button>
          <button
            v-if="product.salePrice != null"
            type="button"
            class="border border-black px-4 py-2"
            @click="remove"
          >
            Quitar rebaja
          </button>
        </div>
      </fieldset>
    </form>
  </section>
</template>
