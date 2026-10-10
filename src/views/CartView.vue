<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cartStore'

const cart = useCartStore()
const errorMessage = ref('')

const formatPrice = (price) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

const itemTotal = (item) =>
  (Math.round(item.price * 100) * item.quantity) / 100

const changeQuantity = (item, quantity) => {
  errorMessage.value = ''

  try {
    cart.setQuantity(item.productId, item.size, quantity)
  } catch (error) {
    errorMessage.value = error.message
  }
}

const removeItem = (item) => {
  errorMessage.value = ''
  cart.removeItem(item.productId, item.size)
}

const clearCart = () => {
  errorMessage.value = ''
  cart.clearCart()
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
                  :disabled="item.quantity <= 1"
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
                  :disabled="item.quantity >= item.stock"
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
                :aria-label="`Eliminar ${item.name}, talla ${item.size}`"
                class="mt-3 text-sm text-black/60 underline underline-offset-4 hover:text-black"
                @click="removeItem(item)"
              >
                Eliminar
              </button>
            </div>
          </li>
        </ul>

        <p
          v-if="errorMessage"
          role="alert"
          class="mt-4 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <button
          type="button"
          class="mt-6 text-sm underline underline-offset-4"
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

        <div aria-live="polite" aria-atomic="true">
          <div class="mt-6 flex justify-between gap-4">
            <span>Unidades</span>
            <span>{{ cart.totalQuantity }}</span>
          </div>

          <div
            class="mt-4 flex justify-between gap-4 border-t border-black/15 pt-4 font-bold"
          >
            <span>Subtotal</span>
            <span>{{ formatPrice(cart.subtotal) }}</span>
          </div>
        </div>

        <p class="mt-4 text-sm text-black/60">
          Gastos de envío no incluidos.
        </p>
      </aside>
    </div>
  </main>
</template>