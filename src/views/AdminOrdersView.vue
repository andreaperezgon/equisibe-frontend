<script setup>
import AdminSectionNav from '../components/admin/AdminSectionNav.vue'
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminOrderCard from '../components/admin/AdminOrderCard.vue'
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/adminOrderService'

const orders = ref([])
const loading = ref(false)
const changingId = ref(null)
const error = ref('')
const message = ref('')
const selectedGroup = ref('PROCESS')
let disposed = false

const groups = [
  { key: 'PROCESS', label: 'En proceso', statuses: ['PAID', 'PREPARING'] },
  { key: 'SHIPPED', label: 'Enviados', statuses: ['SHIPPED'] },
  { key: 'DELIVERED', label: 'Entregados', statuses: ['DELIVERED'] },
]

const busy = computed(() => loading.value || changingId.value !== null)
const visibleOrders = computed(() => {
  const group = groups.find((item) => item.key === selectedGroup.value)
  return orders.value.filter((order) => group.statuses.includes(order.status))
})

const countGroup = (group) =>
  orders.value.filter((order) => group.statuses.includes(order.status)).length

async function loadOrders() {
  if (busy.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminOrders()
    if (!disposed) orders.value = result
  } catch (cause) {
    if (disposed) return
    if ([401, 403].includes(cause.response?.status)) {
      orders.value = []
      error.value = 'Tu sesión no permite consultar estos pedidos. Vuelve a iniciar sesión.'
    } else {
      error.value = 'No se pudieron cargar los pedidos. Pulsa Actualizar pedidos para reintentarlo.'
    }
  } finally {
    if (!disposed) loading.value = false
  }
}

async function advance(order) {
  if (busy.value) return
  const next = {
    PAID: 'PREPARING',
    PREPARING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
  }[order.status]
  if (!next) return

  changingId.value = order.id
  error.value = ''
  message.value = ''
  try {
    const updated = await updateAdminOrderStatus(order.id, next)
    if (disposed) return
    orders.value = orders.value.map((item) =>
      item.id === updated.id ? updated : item,
    )
    message.value = {
      PREPARING: `Pedido #${order.id} en preparación.`,
      SHIPPED: `Pedido #${order.id} enviado. Ya aparece en Enviados.`,
      DELIVERED: `Pedido #${order.id} entregado. Ya aparece en Entregados.`,
    }[updated.status] || 'Pedido actualizado.'
  } catch (cause) {
    if (disposed) return
    if ([401, 403].includes(cause.response?.status)) {
      orders.value = []
      error.value = 'Vuelve a iniciar sesión con la cuenta administradora.'
    } else {
      error.value = 'No se pudo confirmar el cambio. Actualiza los pedidos antes de volver a intentarlo.'
    }
  } finally {
    if (!disposed) changingId.value = null
  }
}

onMounted(loadOrders)
onBeforeUnmount(() => { disposed = true })
</script>

<template>
  <main class="workspace-page workspace-admin mx-auto max-w-5xl px-6 py-10">
    <AdminSectionNav />
    <RouterLink to="/account" class="text-sm underline">
      ← Volver al panel
    </RouterLink>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl">Pedidos</h1>
      <button
        type="button"
        class="border border-black px-4 py-2 disabled:opacity-50"
        :disabled="busy"
        @click="loadOrders"
      >
        {{ loading ? 'Cargando…' : 'Actualizar pedidos' }}
      </button>
    </div>

    <p class="mt-3 text-sm">
      Los pedidos pagados aparecen como recibidos y pasan a preparación,
      envío y entrega.
    </p>

    <div class="my-6 flex flex-wrap gap-3" aria-label="Filtrar pedidos">
      <button
        v-for="group in groups"
        :key="group.key"
        type="button"
        class="border border-black px-4 py-2"
        :class="selectedGroup === group.key ? 'bg-black text-white' : ''"
        :aria-pressed="selectedGroup === group.key"
        @click="selectedGroup = group.key"
      >
        {{ group.label }} ({{ countGroup(group) }})
      </button>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="mb-4 text-green-800">{{ message }}</p>

    <p v-if="loading" role="status">Cargando pedidos…</p>
    <p v-else-if="!visibleOrders.length && !error">
      No hay pedidos en este apartado.
    </p>

    <ul v-if="visibleOrders.length" class="space-y-5">
      <li v-for="order in visibleOrders" :key="order.id">
        <AdminOrderCard
          :order="order"
          :disabled="busy"
          :updating="changingId === order.id"
          @advance="advance"
        />
      </li>
    </ul>
  </main>
</template>
