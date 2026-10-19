<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  updating: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['advance'])

const labels = {
  PAID: 'Recibido',
  PREPARING: 'En preparación',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
}

const actionLabel = computed(() => ({
  PAID: 'Marcar en preparación',
  PREPARING: 'Marcar enviado',
  SHIPPED: 'Marcar entregado',
})[props.order.status])

const formatPrice = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: props.order.currency,
  }).format(value)

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
</script>

<template>
  <article class="border border-black/20 p-5 md:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-xl font-bold">Pedido #{{ order.id }}</h2>
        <time
          :datetime="order.createdAt"
          class="mt-1 block text-sm text-black/70"
        >
          {{ formatDate(order.createdAt) }}
        </time>
        <p class="mt-3 break-words">{{ order.customerName }}</p>
        <p class="mt-1 break-all text-sm text-black/70">
          {{ order.customerEmail }}
        </p>
      </div>

      <div>
        <p class="font-bold">{{ labels[order.status] ?? order.status }}</p>
        <p class="mt-2">{{ formatPrice(order.total) }}</p>
      </div>
    </div>

    <details class="mt-5 border-t border-black/10 pt-4">
      <summary class="cursor-pointer text-sm underline underline-offset-4">
        Ver prendas y dirección de envío
      </summary>

      <ul class="mt-4 space-y-3">
        <li
          v-for="item in order.items"
          :key="`${item.productId}-${item.size}`"
          class="flex flex-wrap justify-between gap-2 text-sm"
        >
          <span>
            {{ item.productName }} · Talla
            {{ item.size === 'TU' ? 'Única' : item.size }}
            · {{ item.quantity }} ud.
          </span>
          <span>{{ formatPrice(item.lineTotal) }}</span>
        </li>
      </ul>

      <div class="mt-5 text-sm leading-relaxed">
        <h3 class="font-bold">Dirección de envío</h3>
        <p>{{ order.shippingAddress.recipientName }}</p>
        <p>{{ order.shippingAddress.addressLine1 }}</p>
        <p v-if="order.shippingAddress.addressLine2">
          {{ order.shippingAddress.addressLine2 }}
        </p>
        <p>
          {{ order.shippingAddress.postalCode }} ·
          {{ order.shippingAddress.city }} ·
          {{ order.shippingAddress.province }}
        </p>
        <p>{{ order.shippingAddress.countryCode }}</p>
        <p class="mt-2">Teléfono: {{ order.shippingAddress.phone }}</p>
        <p class="mt-3">
          Gastos de envío: {{ formatPrice(order.shippingCost) }}
        </p>
      </div>
    </details>

    <button
      v-if="actionLabel"
      type="button"
      :disabled="disabled || updating"
      :aria-busy="updating"
      class="mt-5 border-2 border-black bg-black px-5 py-3 font-bold text-white disabled:opacity-40"
      @click="emit('advance', order)"
    >
      {{ updating ? 'Actualizando…' : actionLabel }}
    </button>
  </article>
</template>
