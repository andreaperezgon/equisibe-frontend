<script setup>
import { RouterLink } from 'vue-router'
import CheckoutAddressSelector from '../components/checkout/CheckoutAddressSelector.vue'
import CartTotals from '../components/shop/CartTotals.vue'
import { useCheckout } from '../composables/useCheckout'

const {
  promoCode,
  cart,
  addresses,
  selectedAddressId,
  loadingAddresses,
  checking,
  addressError,
  checkoutError,
  result,
  canValidate,
  isValid,
  issues,
  loadAddresses,
  checkCheckout,
  paying,
  orderId,
  paymentError,
  pay,
} = useCheckout()

const formatPrice = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)

const itemTotal = (item) => {
  const validated = result.value?.cart.valid
    ? result.value.cart.items.find((line) =>
        line.productId === item.productId && line.size === item.size)
    : null
  return validated
    ? validated.lineTotal
    : (Math.round(item.price * 100) * item.quantity) / 100
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-5 py-12 md:px-8">
    <RouterLink to="/cart" class="text-sm underline underline-offset-4">
      ← Volver al carrito
    </RouterLink>

    <h1 class="mt-6 text-3xl md:text-4xl">
      Revisa tu compra
    </h1>

    <div v-if="cart.items.length === 0" class="mt-8">
      <p role="status">Tu carrito está vacío.</p>
      <RouterLink
        to="/shop"
        class="mt-5 inline-block border-2 border-black px-6 py-3 font-bold"
      >
        Ir a la tienda
      </RouterLink>
    </div>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-[3fr_2fr]">
      <section aria-label="Selección de dirección">
        <p v-if="loadingAddresses" role="status">
          Cargando direcciones…
        </p>

        <div v-else-if="addressError">
          <p role="alert" class="text-red-700">
            {{ addressError }}
          </p>
          <button
            type="button"
            class="mt-4 border-2 border-black px-5 py-2"
            @click="loadAddresses"
          >
            Reintentar
          </button>
        </div>

        <template v-else>
          <CheckoutAddressSelector
            v-model="selectedAddressId"
            :addresses="addresses"
            :disabled="checking || paying || !!orderId"
          />

          <button
            type="button"
            :disabled="checking || paying || !!orderId"
            class="mt-4 block text-sm underline underline-offset-4 disabled:opacity-40"
            @click="loadAddresses"
          >
            Recargar direcciones
          </button>
        </template>
      </section>

      <aside
        aria-label="Resumen de la compra"
        class="h-fit border border-black/15 p-6"
      >
        <h2 class="text-xl font-bold">Tu compra</h2>

        <ul class="mt-5 divide-y divide-black/15">
          <li
            v-for="item in cart.items"
            :key="`${item.productId}-${item.size}`"
            class="flex justify-between gap-4 py-4"
          >
            <div class="min-w-0">
              <p class="break-words font-bold">{{ item.name }}</p>
              <p class="mt-1 text-sm text-black/70">
                Talla {{ item.size === 'TU' ? 'Única' : item.size }}
                · {{ item.quantity }} ud.
              </p>
            </div>
            <p class="shrink-0">{{ formatPrice(itemTotal(item)) }}</p>
          </li>
        </ul>

        <div class="mt-5">
          <label for="checkout-promo-code" class="block text-sm font-bold">
            Código promocional
          </label>
          <input
            id="checkout-promo-code"
            v-model="promoCode"
            maxlength="40"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="Introduce tu código"
            :disabled="checking || paying || !!orderId"
            class="mt-2 w-full border border-black/30 bg-transparent p-3 uppercase disabled:opacity-50"
          />
          <p class="mt-2 text-sm text-black/70">
            Pulsa Comprobar compra para aplicar o quitar el código.
          </p>
        </div>

        <div
          v-if="result?.cart.valid && result.cart.promoCode"
          role="status"
          class="mt-5 text-sm text-green-800"
        >
          <p>Importe antes del código: {{ formatPrice(result.cart.originalSubtotal) }}</p>
          <p class="mt-1 font-bold">
            {{ result.cart.promoCode }} aplicado:
            −{{ formatPrice(result.cart.discountAmount) }}
          </p>
          <p class="mt-1">El descuento no se aplica al envío.</p>
        </div>

        <CartTotals
          class="mt-6"
          :subtotal="result?.cart.subtotal ?? cart.subtotal"
          :shipping-cost="result?.cart.shippingCost ?? null"
          :total="result?.cart.total ?? null"
        />

        <p
          v-if="!selectedAddressId"
          class="mt-5 text-sm text-black/70"
        >
          Selecciona una dirección de envío para comprobar la compra.
        </p>

        <button
          type="button"
          data-testid="validate-checkout"
          :disabled="!canValidate"
          :aria-busy="checking"
          class="mt-5 w-full border-2 border-black bg-black px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          @click="checkCheckout"
        >
          {{ checking ? 'Comprobando…' : 'Comprobar compra' }}
        </button>

        <p
          v-if="checkoutError"
          role="alert"
          class="mt-4 text-sm text-red-700"
        >
          {{ checkoutError }}
        </p>

        <div
          v-if="result && !result.cart.valid"
          role="alert"
          class="mt-4 text-sm text-red-700"
        >
          <p>Revisa las prendas del carrito antes de continuar.</p>
          <ul v-if="issues.length" class="mt-2 list-disc space-y-2 pl-5">
            <li v-for="(issue, index) in issues" :key="index">
              {{ issue }}
            </li>
          </ul>
          <RouterLink
            to="/cart"
            class="mt-3 inline-block underline underline-offset-4"
          >
            Modificar carrito
          </RouterLink>
        </div>

        <p
          v-if="isValid && !orderId"
          role="status"
          class="mt-4 text-sm text-green-800"
        >
          Dirección y disponibilidad comprobadas. Revisa los importes
          actualizados. Todavía no se ha creado ni cobrado ningún pedido.
        </p>
        <button
          v-if="isValid || orderId"
          type="button"
          data-testid="pay-checkout"
          :disabled="paying || (!orderId && !canValidate)"
          :aria-busy="paying"
          class="mt-5 w-full border-2 border-black bg-black px-5 py-3 font-bold text-white disabled:opacity-40"
          @click="pay"
        >
          {{ paying ? 'Abriendo pago…' : 'Pagar con Stripe' }}
        </button>
        <p v-if="paymentError" role="alert" class="mt-4 text-sm text-red-700">
          {{ paymentError }}
        </p>
        <RouterLink v-if="orderId" :to="`/orders/${orderId}`" class="mt-3 block text-sm underline">
          Consultar pedido #{{ orderId }}
        </RouterLink>
      </aside>
    </div>
  </main>
</template>
