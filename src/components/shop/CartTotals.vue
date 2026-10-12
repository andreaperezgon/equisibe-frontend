<script setup>
defineProps({
  subtotal: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    default: null,
  },
  total: {
    type: Number,
    default: null,
  },
})

const formatPrice = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
</script>

<template>
  <div aria-live="polite" aria-atomic="true">
    <dl class="space-y-4">
      <div class="flex justify-between gap-4">
        <dt>Subtotal</dt>
        <dd>{{ formatPrice(subtotal) }}</dd>
      </div>

      <div class="flex justify-between gap-4">
        <dt>Envío</dt>
        <dd data-testid="shipping-cost">
          {{
            shippingCost === null
              ? 'Pendiente de comprobar'
              : shippingCost === 0
                ? 'Gratis'
                : formatPrice(shippingCost)
          }}
        </dd>
      </div>

      <div
        class="flex justify-between gap-4 border-t border-black/15 pt-4 font-bold"
      >
        <dt>Total</dt>
        <dd data-testid="cart-total">
          {{
            total === null
              ? 'Pendiente de comprobar'
              : formatPrice(total)
          }}
        </dd>
      </div>
    </dl>

    <p class="mt-4 text-sm text-black/60">
      Envíos a España: 3,95 €. Gratis en compras de 80 € o más.
    </p>
  </div>
</template>