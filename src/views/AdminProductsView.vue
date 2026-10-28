<script setup>
import AdminSectionNav from '../components/admin/AdminSectionNav.vue'
import AdminProductSale from '../components/admin/AdminProductSale.vue'
import { updateAdminProductSale } from '../services/adminProductService'

import AdminProductStock from '../components/admin/AdminProductStock.vue'
import { updateAdminProductStock } from '../services/adminProductService'

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import AdminProductForm from '../components/admin/AdminProductForm.vue'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  setAdminProductActive,
} from '../services/adminProductService'

const auth = useAuthStore()
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const changingId = ref(null)
const error = ref('')
const message = ref('')
const showForm = ref(false)
const editingProduct = ref(null)
const formContainer = ref(null)

const busy = computed(() =>
  loading.value || saving.value || changingId.value !== null,
)

const formatPrice = (price) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

let active = true

const describeError = (failure) => {
  const status = failure.response?.status

  if ([401, 403].includes(status)) {
    products.value = []
    showForm.value = false
    return 'Inicia sesión con una cuenta administradora para continuar.'
  }

  if (status === 400) {
    return 'Revisa los campos. El precio admite dos decimales y la imagen debe ser una ruta de la tienda o una dirección HTTPS.'
  }

  if (status === 404) {
    return 'El producto no está disponible. Actualiza la lista.'
  }

  return 'No se pudo completar la operación. Inténtalo de nuevo.'
}

const loadProducts = async () => {
  if (busy.value) return

  if (auth.user?.role !== 'ADMIN') {
    error.value = 'Necesitas permisos de administrador.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await getAdminProducts()
    if (active) products.value = data
  } catch (failure) {
    if (active) error.value = describeError(failure)
  } finally {
    if (active) loading.value = false
  }
}

const openForm = async (product = null) => {
  if (busy.value) return

  editingProduct.value = product ? { ...product } : null
  error.value = ''
  message.value = ''
  showForm.value = true

  await nextTick()
  formContainer.value?.scrollIntoView?.({
    behavior: 'smooth',
    block: 'start',
  })
}

const closeForm = () => {
  if (saving.value) return
  showForm.value = false
  editingProduct.value = null
  error.value = ''
}

const saveProduct = async (payload) => {
  if (busy.value) return

  saving.value = true
  error.value = ''
  message.value = ''
  const editingId = editingProduct.value?.id

  try {
    const product = editingId
      ? await updateAdminProduct(editingId, payload)
      : await createAdminProduct(payload)

    if (!active) return

    products.value = editingId
      ? products.value.map((item) =>
          item.id === product.id ? product : item,
        )
      : [product, ...products.value]

    showForm.value = false
    editingProduct.value = null
    message.value = editingId
      ? 'Producto actualizado.'
      : 'Producto creado. Su stock inicial es cero.'
  } catch (failure) {
    if (active) error.value = describeError(failure)
  } finally {
    if (active) saving.value = false
  }
}

const toggleActive = async (product) => {
  if (busy.value) return

  changingId.value = product.id
  error.value = ''
  message.value = ''

  try {
    const updated = await setAdminProductActive(
      product.id,
      !product.active,
    )

    if (!active) return

    products.value = products.value.map((item) =>
      item.id === updated.id ? updated : item,
    )

    message.value = updated.active
      ? 'Producto reactivado en la tienda.'
      : 'Producto retirado de la tienda.'
  } catch (failure) {
    if (active) error.value = describeError(failure)
  } finally {
    if (active) changingId.value = null
  }
}


const saveStock = async ({ productId, stockBySize }) => {
  if (busy.value) return
  changingId.value = productId
  error.value = ''
  message.value = ''
  try {
    const updated = await updateAdminProductStock(productId, stockBySize)
    if (!active) return
    products.value = products.value.map((product) =>
      product.id === updated.id ? updated : product,
    )
    message.value = 'Stock de ' + updated.name + ' actualizado.'
  } catch (failure) {
    if (!active) return
    error.value = failure.response?.status === 400
      ? 'Revisa las unidades de cada talla y actualiza la lista si fuera necesario.'
      : describeError(failure)
  } finally {
    if (active) changingId.value = null
  }
}


const saveSale = async ({ productId, salePrice }) => {
  if (busy.value) return
  changingId.value = productId
  error.value = ''
  message.value = ''
  try {
    const updated = await updateAdminProductSale(productId, salePrice)
    if (!active) return
    products.value = products.value.map((product) =>
      product.id === updated.id ? updated : product,
    )
    message.value = updated.salePrice == null
      ? 'Rebaja quitada. Se aplica el precio habitual.'
      : 'Rebaja guardada.'
  } catch (failure) {
    if (!active) return
    error.value = failure.response?.status === 400
      ? 'La rebaja debe ser mayor que cero y menor que el precio habitual.'
      : describeError(failure)
  } finally {
    if (active) changingId.value = null
  }
}

onMounted(loadProducts)
onBeforeUnmount(() => {
  active = false
})
</script>

<template>
  <main class="workspace-page workspace-admin mx-auto max-w-6xl px-5 py-12 md:px-8">
    <AdminSectionNav />
    <RouterLink to="/account" class="text-sm underline underline-offset-4">
      ← Volver al panel
    </RouterLink>

    <h1 class="mt-6 text-3xl font-semibold">
      Administrar productos
    </h1>

    <p v-if="error" role="alert" class="mt-5 text-red-700">
      {{ error }}
    </p>

    <template v-if="auth.user?.role === 'ADMIN'">
      <div class="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          :disabled="busy"
          class="border-2 border-black bg-black px-5 py-3 font-bold text-white disabled:opacity-40"
          @click="openForm()"
        >
          Nueva prenda
        </button>

        <button
          type="button"
          :disabled="busy"
          class="border border-black px-5 py-3 disabled:opacity-40"
          @click="loadProducts"
        >
          {{ loading ? 'Cargando…' : 'Actualizar productos' }}
        </button>
      </div>

      <p v-if="message" role="status" class="mt-5 text-green-800">
        {{ message }}
      </p>

      <div
        v-if="showForm"
        ref="formContainer"
        class="mt-8 scroll-mt-6"
      >
        <AdminProductForm
          :key="editingProduct?.id ?? 'new'"
          :product="editingProduct"
          :disabled="saving"
          @save="saveProduct"
          @cancel="closeForm"
        />
      </div>

      <p v-if="loading" role="status" class="mt-8">
        Cargando productos…
      </p>

      <p v-else-if="!products.length && !error" class="mt-8">
        Todavía no hay productos.
      </p>

      <ul v-else class="mt-8 space-y-4">
        <li
          v-for="product in products"
          :key="product.id"
          class="border border-black/20 p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-5">
            <div class="min-w-0">
              <h2 class="wrap-break-word text-xl font-bold">
                {{ product.name }}
              </h2>

              <p class="mt-2 text-sm text-black/70">
                {{ product.category }} · {{ formatPrice(product.price) }}
              </p>

              <p
                class="mt-2 text-sm font-bold"
                :class="product.active ? 'text-green-800' : 'text-black/60'"
              >
                {{ product.active ? 'Activo en la tienda' : 'Retirado' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                :disabled="busy"
                :aria-label="`Editar ${product.name}`"
                class="border border-black px-4 py-2 disabled:opacity-40"
                @click="openForm(product)"
              >
                Editar
              </button>

              <button
                type="button"
                :disabled="busy"
                :aria-label="`${product.active ? 'Retirar' : 'Reactivar'} ${product.name}`"
                class="border border-black px-4 py-2 disabled:opacity-40"
                @click="toggleActive(product)"
              >
                {{
                  changingId === product.id
                    ? 'Actualizando…'
                    : product.active
                      ? 'Retirar'
                      : 'Reactivar'
                }}
              </button>
            </div>
          </div>
          <AdminProductStock
            :product="product"
            :disabled="busy"
            @save="saveStock"
          />
          <AdminProductSale
            :product="product"
            :disabled="busy"
            @save="saveSale"
          />
        </li>
      </ul>
    </template>
  </main>
</template>
