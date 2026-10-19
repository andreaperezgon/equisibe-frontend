<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
})
const onSale = computed(() =>
  props.product.originalPrice != null &&
  Number(props.product.originalPrice) > Number(props.product.price),
)
const money = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR',
  }).format(value)
</script>

<template>
  <span class="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <template v-if="onSale">
      <span class="sr-only">Precio anterior:</span>
      <del class="text-black/60">{{ money(product.originalPrice) }}</del>
      <span class="sr-only">Precio rebajado:</span>
    </template>
    <span :class="onSale ? 'font-bold text-red-700' : ''">
      {{ money(product.price) }}
    </span>
  </span>
</template>
