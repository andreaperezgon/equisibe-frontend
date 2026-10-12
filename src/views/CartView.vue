<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import CartTotals from '../components/shop/CartTotals.vue'
import { useCartStore } from '../stores/cartStore'
import { validateCart } from '../services/cartService'

const cart = useCartStore()

const errorMessage = ref('')
const validationMessage = ref('')
const validationIssues = ref([])
const isValidating = ref(false)
const validatedTotals = ref(null)

let latestRequest = 0

const cartSignature = () =>
  JSON.stringify(
    cart.items.map((item) => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
    })),
  )

const resetValidation = () => {
  errorMessage.value = ''
  validationMessage.value = ''
  validationIssues.value = []
  validatedTotals.value = null
}

watch(
  cartSignature,
  () => {
    latestRequest += 1
    isValidating.value = false
    resetValidation()
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => {
  latestRequest += 1
})

const formatPrice = (price) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

const itemTotal = (item) =>
  (Math.round(item.price * 100) * item.quantity) / 100

const changeQuantity = (item, quantity) => {
  if (isValidating.value) return

  resetValidation()

  try {
    cart.setQuantity(item.productId, item.size, quantity)
  } catch (error) {
    errorMessage.value = error.message
  }
}

const removeItem = (item) => {
  if (isValidating.value) return

  resetValidation()
  cart.removeItem(item.productId, item.size)
}

const clearCart = () => {
  if (isValidating.value) return

  resetValidation()
  cart.clearCart()
}

const describeIssue = (issue) => {
  const item = cart.items.find(
    (item) =>
      item.productId === issue.productId &&
      item.size === issue.size,
  )

  const name = item?.name ?? 'Prenda'
  const size = issue.size === 'TU' ? 'Única' : issue.size
  const label = `${name}, talla ${size}`

  switch (issue.code) {
    case 'PRODUCT_UNAVAILABLE':
      return `${label}: ya no está disponible. Elimínala del carrito.`

    case 'INVALID_SIZE':
      return `${label}: esta talla no está disponible para la prenda. Elimina la línea y elige otra talla desde la tienda.`

    case 'INSUFFICIENT_STOCK':
      if (issue.availableStock === 0) {
        return `${label}: está agotada. Elimínala del carrito.`
      }

      if (issue.availableStock === 1) {
        return `${label}: solo queda 1 unidad. Reduce la cantidad.`
      }

      return `${label}: quedan ${issue.availableStock} unidades. Reduce la cantidad.`

    default:
      return `${label}: no se pudo confirmar su disponibilidad.`
  }
}

const checkCart = async () => {
  if (isValidating.value || cart.items.length === 0) return

  resetValidation()
  isValidating.value = true

  const requestId = ++latestRequest
  const signature = cartSignature()

  const items = cart.items.map((item) => ({
    productId: item.productId,
    size: item.size,
    quantity: item.quantity,
  }))

  try {
    const result = await validateCart(items)

    if (
      requestId !== latestRequest ||
      signature !== cartSignature()
    ) {
      return
    }

    if (!result.valid) {
      validationIssues.value = result.issues.map(describeIssue)

      errorMessage.value = validationIssues.value.length
        ? 'Revisa los siguientes problemas y vuelve a comprobar la cesta.'
        : 'No se pudo validar la cesta. Inténtalo de nuevo.'

      return
    }

    let pricesChanged = false

    for (const validatedItem of result.items) {
      const item = cart.items.find(
        (item) =>
          item.productId === validatedItem.productId &&
          item.size === validatedItem.size,
      )

      if (!item) continue

      if (Number(item.price) !== Number(validatedItem.unitPrice)) {
        pricesChanged = true
      }

      item.price = validatedItem.unitPrice
      item.name = validatedItem.name
    }

    validatedTotals.value = {
      subtotal: result.subtotal,
      shippingCost: result.shippingCost,
      total: result.total,
    }

    validationMessage.value = pricesChanged
      ? 'Hay existencias para tu cesta. Algunos precios han cambiado y el subtotal se ha actualizado. Revísalo antes de continuar.'
      : 'Hay existencias para todas las prendas de tu cesta y los precios están actualizados.'
  } catch (error) {
    if (
      requestId !== latestRequest ||
      signature !== cartSignature()
    ) {
      return
    }

    const status = error.response?.status

    if (status === 401 || status === 403) {
      errorMessage.value =
        'No se pudo autorizar la comprobación. Inicia sesión de nuevo y vuelve a intentarlo.'
    } else if (status === 400) {
      errorMessage.value =
        'La cesta contiene datos que no se pueden validar. Revisa las prendas y sus cantidades.'
    } else {
      errorMessage.value =
        'No se pudo comprobar la cesta. Inténtalo de nuevo en unos momentos.'
    }
  } finally {
    if (requestId === latestRequest) {
      isValidating.value = false
    }
  }
}
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
    <RouterLink
      to="/shop"
      class="text-sm underline underline-offset-4"
    >
      ← Seguir comprando
    </RouterLink>

    <h1 class="mt-6 text-3xl md:text-4xl">
      Tu carrito
    </h1>

    <div v-if="cart.items.length === 0" class="mt-10">
      <p role="status" class="text-black/70">
        Tu carrito está vacío.
      </p>

      <RouterLink
        to="/shop"
        class="mt-6 inline-block border-2 border-black px-6 py-3 font-bold transition hover:bg-black hover:text-white"
      >
        Descubrir prendas
      </RouterLink>
    </div>

    <div v-else class="mt-10 grid gap-12 lg:grid-cols-[2fr_1fr]">
      <section aria-label="Prendas del carrito">
        <ul class="divide-y divide-black/15">
          <li
            v-for="item in cart.items"
            :key="`${item.productId}-${item.size}`"
            class="flex gap-4 py-6 first:pt-0 sm:gap-6"
          >
            <RouterLink
              :to="`/shop/${item.productId}`"
              :aria-label="`Ver ${item.name}`"
              class="block w-24 shrink-0 self-start sm:w-32"
            >
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="aspect-[3/4] w-full bg-black/5 object-cover"
              />

              <span
                v-else
                class="flex aspect-[3/4] items-center justify-center bg-black/5 p-2 text-center text-xs"
              >
                Imagen no disponible
              </span>
            </RouterLink>

            <div class="min-w-0 flex-1">
              <RouterLink :to="`/shop/${item.productId}`">
                <h2 class="font-bold">
                  {{ item.name }}
                </h2>
              </RouterLink>

              <p class="mt-2 text-sm text-black/60">
                Talla: {{ item.size === 'TU' ? 'Única' : item.size }}
              </p>

              <p class="mt-2 text-sm">
                {{ formatPrice(item.price) }} / unidad
              </p>

              <div
                role="group"
                :aria-label="`Cantidad de ${item.name}, talla ${item.size}`"
                class="mt-4 inline-flex items-center border border-black/30"
              >
                <button
                  type="button"
                  :disabled="isValidating || item.quantity <= 1"
                  :aria-label="`Reducir cantidad de ${item.name}, talla ${item.size}`"
                  class="h-10 w-10 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="changeQuantity(item, item.quantity - 1)"
                >
                  −
                </button>

                <span class="min-w-10 px-2 text-center">
                  {{ item.quantity }}
                </span>

                <button
                  type="button"
                  :disabled="isValidating || item.quantity >= item.stock"
                  :aria-label="`Aumentar cantidad de ${item.name}, talla ${item.size}`"
                  class="h-10 w-10 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="changeQuantity(item, item.quantity + 1)"
                >
                  +
                </button>
              </div>

              <p class="mt-4 font-bold">
                {{ formatPrice(itemTotal(item)) }}
              </p>

              <button
                type="button"
                :disabled="isValidating"
                :aria-label="`Eliminar ${item.name}, talla ${item.size}`"
                class="mt-3 text-sm text-black/60 underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                @click="removeItem(item)"
              >
                Eliminar
              </button>
            </div>
          </li>
        </ul>

        <button
          type="button"
          :disabled="isValidating"
          class="mt-6 text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-30"
          @click="clearCart"
        >
          Vaciar carrito
        </button>
      </section>

      <aside
        aria-label="Resumen del carrito"
        class="h-fit border border-black/15 p-6"
      >
        <h2 class="text-xl font-bold">
          Resumen
        </h2>

        <div
          class="mt-6 flex justify-between gap-4"
          aria-live="polite"
        >
          <span>Unidades</span>
          <span>{{ cart.totalQuantity }}</span>
        </div>

        <CartTotals
          class="mt-4"
          :subtotal="validatedTotals?.subtotal ?? cart.subtotal"
          :shipping-cost="validatedTotals?.shippingCost ?? null"
          :total="validatedTotals?.total ?? null"
        />

        <button
          type="button"
          data-testid="validate-cart"
          :disabled="isValidating"
          :aria-busy="isValidating"
          class="mt-6 w-full border-2 border-black bg-black px-5 py-3 font-bold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          @click="checkCart"
        >
          {{
            isValidating
              ? 'Comprobando…'
              : 'Comprobar disponibilidad'
          }}
        </button>

        <div
          v-if="errorMessage"
          role="alert"
          class="mt-4 text-sm text-red-700"
        >
          <p>{{ errorMessage }}</p>

          <ul
            v-if="validationIssues.length"
            class="mt-3 list-disc space-y-2 pl-5"
          >
            <li
              v-for="(issue, index) in validationIssues"
              :key="index"
            >
              {{ issue }}
            </li>
          </ul>
        </div>

        <p
          v-if="validationMessage"
          role="status"
          data-testid="cart-validation-success"
          class="mt-4 text-sm text-green-800"
        >
          {{ validationMessage }}
        </p>

        <p class="mt-3 text-xs text-black/60">
          La disponibilidad puede cambiar hasta finalizar la compra.
        </p>
      </aside>
    </div>
  </main>
</template>