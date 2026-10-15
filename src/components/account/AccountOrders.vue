<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getOrders } from '../../services/orderService'

const orders = ref([])
const loading = ref(true)
const error = ref('')
const labels = {
  PENDING_PAYMENT: 'Pendiente de pago', PAID: 'Pagado', PREPARING: 'En preparación',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', EXPIRED: 'Caducado',
}
const paidStates = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED']
const formatDate = (value) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value))
const formatPrice = (order) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: order.currency,
}).format(order.total)
let active = true
let fetching = false

const loadOrders = async () => {
  if (fetching) return
  fetching = true
  loading.value = true
  error.value = ''
  try {
    const data = await getOrders()
    if (active) orders.value = data
  } catch (failure) {
    if (active) error.value = [401, 403].includes(failure.response?.status)
      ? 'Inicia sesión de nuevo para consultar tus pedidos.'
      : 'No se pudieron cargar tus pedidos. Inténtalo de nuevo.'
  } finally {
    fetching = false
    if (active) loading.value = false
  }
}

onMounted(loadOrders)
onBeforeUnmount(() => { active = false })
</script>

<template>
  <section id="orders" aria-labelledby="orders-heading" class="mt-12 border-t border-black/20 pt-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 id="orders-heading" class="text-2xl font-semibold">Mis pedidos</h2>
      <button type="button" :disabled="loading" :aria-busy="loading" class="text-sm underline underline-offset-4 disabled:opacity-40" @click="loadOrders">
        {{ loading ? 'Cargando…' : 'Actualizar pedidos' }}
      </button>
    </div>
    <p v-if="loading" role="status" class="mt-5">Cargando tus pedidos…</p>
    <div v-else-if="error" class="mt-5">
      <p role="alert" class="text-red-700">{{ error }}</p>
      <button type="button" class="mt-3 underline underline-offset-4" @click="loadOrders">Reintentar</button>
    </div>
    <div v-else-if="orders.length === 0" class="mt-5">
      <p>Todavía no tienes pedidos.</p>
      <RouterLink to="/shop" class="mt-3 inline-block underline underline-offset-4">Ir a la tienda</RouterLink>
    </div>
    <ul v-else class="mt-6 space-y-5">
      <li v-for="order in orders" :key="order.id" class="border border-black/20 p-5" data-testid="account-order">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="font-bold">Pedido #{{ order.id }}</h3>
            <time :datetime="order.createdAt" class="mt-1 block text-sm text-black/70">{{ formatDate(order.createdAt) }}</time>
          </div>
          <span class="text-sm font-bold" :class="paidStates.includes(order.status) ? 'text-green-800' : 'text-black/70'">
            {{ labels[order.status] ?? order.status }}
          </span>
        </div>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="item in order.items" :key="`${item.productId}-${item.size}`">
            {{ item.productName }} · Talla {{ item.size === 'TU' ? 'Única' : item.size }} · {{ item.quantity }} ud.
          </li>
        </ul>
        <div class="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
          <p class="font-bold">Total: {{ formatPrice(order) }}</p>
          <RouterLink :to="`/orders/${order.id}`" class="text-sm underline underline-offset-4" :aria-label="`Ver pedido ${order.id}`">
            {{ order.status === 'PENDING_PAYMENT' ? 'Ver pedido y continuar pago' : 'Ver pedido' }}
          </RouterLink>
        </div>
      </li>
    </ul>
  </section>
</template>
