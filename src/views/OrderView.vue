<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { createCheckoutSession, getOrder, redirectToStripe, restoreOrderCart } from '../services/orderService'
import CartTotals from '../components/shop/CartTotals.vue'

const route = useRoute()
const cart = useCartStore()
const orderId = route.params.id
const order = ref(null)
const loading = ref(true)
const error = ref('')
const paying = ref(false)
const paymentError = ref('')
const paidStates = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED']
const isPaid = computed(() => paidStates.includes(order.value?.status))
const statusLabels = {
  PENDING_PAYMENT: 'Pendiente de pago', PAID: 'Pagado', PREPARING: 'En preparación',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', EXPIRED: 'Caducado',
}
let active = true
let timer
let attempts = 0
let refreshing = false

const formatPrice = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR',
}).format(value)

const refresh = async () => {
  if (refreshing) return
  clearTimeout(timer)
  refreshing = true
  error.value = ''
  try {
    const data = await getOrder(orderId)
    if (!active) return
    order.value = data
    restoreOrderCart(orderId, cart, paidStates.includes(data.status))
    if (data.status === 'PENDING_PAYMENT' && route.query.payment === 'returned' && attempts++ < 10) {
      timer = setTimeout(refresh, 2000)
    }
  } catch (failure) {
    if (!active) return
    error.value = failure.response?.status === 404
      ? 'El pedido no está disponible.'
      : 'No se pudo consultar el pedido. Vuelve a intentarlo.'
  } finally {
    refreshing = false
    if (active) loading.value = false
  }
}

const pay = async () => {
  if (paying.value || order.value?.status !== 'PENDING_PAYMENT') return
  paying.value = true
  paymentError.value = ''
  try {
    const session = await createCheckoutSession(orderId)
    if (active) redirectToStripe(session.url)
  } catch {
    if (active) paymentError.value = 'No se pudo abrir el pago. Actualiza el estado del pedido antes de reintentarlo.'
  } finally {
    if (active) paying.value = false
  }
}

onMounted(refresh)
onBeforeUnmount(() => { active = false; clearTimeout(timer) })
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 py-12 md:px-8">
    <h1 class="text-3xl">Pedido #{{ orderId }}</h1>
    <p v-if="loading" role="status" class="mt-6">Consultando tu pedido…</p>
    <p v-if="error" role="alert" class="mt-6 text-red-700">{{ error }}</p>
    <template v-if="order">
      <p role="status" class="mt-6 text-xl" :class="isPaid ? 'text-green-800' : ''">
        {{ statusLabels[order.status] ?? order.status }}
      </p>
      <p v-if="isPaid" class="mt-3">Tu pago está confirmado. Gracias por comprar en Equisibé.</p>
      <p v-else-if="order.status === 'PENDING_PAYMENT' && route.query.payment === 'returned'" class="mt-3">
        Estamos esperando la confirmación del pago. El pedido se actualizará cuando la recibamos.
      </p>
      <p v-else-if="order.status === 'PENDING_PAYMENT' && route.query.payment === 'cancelled'" class="mt-3">
        Has vuelto sin completar el pago. Puedes retomarlo para este mismo pedido.
      </p>
      <ul class="mt-8 divide-y divide-black/15">
        <li v-for="item in order.items" :key="`${item.productId}-${item.size}`" class="flex justify-between gap-4 py-4">
          <div>{{ item.productName }} · Talla {{ item.size === 'TU' ? 'Única' : item.size }} · {{ item.quantity }} ud.</div>
          <span class="shrink-0">{{ formatPrice(item.lineTotal) }}</span>
        </li>
      </ul>
      <CartTotals class="mt-6" :subtotal="order.subtotal" :shipping-cost="order.shippingCost" :total="order.total" />
      <section class="mt-8" aria-label="Dirección de envío">
        <h2 class="text-xl">Dirección de envío</h2>
        <p class="mt-3">{{ order.shippingAddress.recipientName }}</p>
        <p>{{ order.shippingAddress.addressLine1 }} {{ order.shippingAddress.addressLine2 }}</p>
        <p>{{ order.shippingAddress.postalCode }} · {{ order.shippingAddress.city }} · {{ order.shippingAddress.province }}</p>
      </section>
      <button v-if="order.status === 'PENDING_PAYMENT'" type="button" data-testid="retry-payment" :disabled="paying" :aria-busy="paying"
        class="mt-8 border-2 border-black bg-black px-6 py-3 font-bold text-white disabled:opacity-40" @click="pay">
        {{ paying ? 'Abriendo pago…' : 'Pagar con Stripe' }}
      </button>
      <p v-if="paymentError" role="alert" class="mt-4 text-red-700">{{ paymentError }}</p>
    </template>
    <button type="button" class="mt-6 block underline" :disabled="loading" @click="refresh">Actualizar estado</button>
    <RouterLink to="/account" class="mt-6 mr-6 inline-block underline">Mis pedidos</RouterLink>
    <RouterLink to="/shop" class="mt-6 inline-block underline">Volver a la tienda</RouterLink>
    <RouterLink v-if="!isPaid" to="/cart" class="ml-6 inline-block underline">Volver al carrito</RouterLink>
  </main>
</template>
