<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getProduct } from '../services/productService'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const authDialog = ref(null)
const checkingSession = ref(false)

const product = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)
const selectedSize = ref('')
const imageFailed = ref(false)
const cartMessage = ref('')
const cartError = ref('')

let latestRequest = 0

const sizes = computed(() =>
  Object.prototype.hasOwnProperty.call(
    product.value?.stockBySize ?? {},
    'TU',
  )
    ? ['TU']
    : ['S', 'M', 'L', 'XL'],
)

const isSizeAvailable = (size) =>
  (product.value?.stockBySize?.[size] ?? 0) > 0

const isSoldOut = computed(() =>
  sizes.value.every((size) => !isSizeAvailable(size)),
)

const formattedPrice = computed(() =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(product.value?.price ?? 0),
)

const addToCart = async () => {
  if (checkingSession.value || !product.value) return

  cartMessage.value = ''
  cartError.value = ''
  checkingSession.value = true

  try {
    if (!auth.isAuthenticated) {
      await auth.fetchCurrentUser()
    }

    if (!auth.isAuthenticated) {
      authDialog.value.showModal()
      return
    }

    cart.addItem(product.value, selectedSize.value)
    cartMessage.value = 'Prenda añadida al carrito.'
  } catch (error) {
    cartError.value =
      error.response || !auth.isAuthenticated
        ? 'No se pudo comprobar tu sesión. Inténtalo de nuevo.'
        : error.message
  } finally {
    checkingSession.value = false
  }
}

watch(selectedSize, () => {
  cartMessage.value = ''
  cartError.value = ''
})

const loadProduct = async () => {
  const requestId = ++latestRequest

  cartMessage.value = ''
  cartError.value = ''
  isLoading.value = true
  errorMessage.value = ''
  notFound.value = false
  product.value = null
  selectedSize.value = ''
  imageFailed.value = false

  try {
    const result = await getProduct(route.params.id)

    if (requestId !== latestRequest) return

    product.value = result
  } catch (error) {
    if (requestId !== latestRequest) return

    notFound.value = error.response?.status === 404
    errorMessage.value = notFound.value
      ? 'La prenda no está disponible.'
      : 'No se pudo cargar la prenda. Inténtalo de nuevo.'
  } finally {
    if (requestId === latestRequest) {
      isLoading.value = false
    }
  }
}

watch(() => route.params.id, loadProduct, { immediate: true })
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
    <RouterLink
      to="/shop"
      class="text-sm underline underline-offset-4"
    >
      ← Volver a la tienda
    </RouterLink>

    <p v-if="isLoading" role="status" class="mt-10">
      Cargando prenda…
    </p>

    <div v-else-if="errorMessage" class="mt-10">
      <p role="alert" class="text-red-700">
        {{ errorMessage }}
      </p>

      <button
        v-if="!notFound"
        type="button"
        class="mt-4 border-2 border-black px-5 py-2 font-bold transition hover:bg-black hover:text-white"
        @click="loadProduct"
      >
        Reintentar
      </button>
    </div>

    <div
      v-else-if="product"
      class="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <div
        class="flex aspect-[3/4] items-center justify-center overflow-hidden bg-black/5"
      >
        <img
          v-if="product.imageUrl && !imageFailed"
          :src="product.imageUrl"
          :alt="product.name"
          class="h-full w-full object-cover"
          @error="imageFailed = true"
        />

        <span v-else class="px-4 text-center text-sm text-black/60">
          Imagen no disponible
        </span>
      </div>

      <section class="lg:py-6">
        <p class="text-sm text-black/60">
          {{ product.category }}
        </p>

        <h1 class="mt-3 text-3xl md:text-4xl">
          {{ product.name }}
        </h1>

        <p class="mt-5 text-2xl">
          {{ formattedPrice }}
        </p>

        <p class="mt-8 whitespace-pre-line leading-relaxed text-black/70">
          {{ product.description }}
        </p>

        <fieldset class="mt-10">
          <legend class="font-bold">
            Selecciona tu talla
          </legend>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              v-for="size in sizes"
              :key="size"
              type="button"
              :disabled="!isSizeAvailable(size)"
              :aria-pressed="selectedSize === size"
              :aria-label="`${size === 'TU' ? 'Talla única' : size}: ${isSizeAvailable(size) ? 'disponible' : 'agotada'}`"
              :class="[
                selectedSize === size
                  ? 'border-black bg-black text-white'
                  : 'border-black/30',
                !isSizeAvailable(size)
                  ? 'cursor-not-allowed border-black/10 text-black/30 line-through'
                  : 'hover:border-black',
              ]"
              class="flex h-12 min-w-12 items-center justify-center border px-4 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
        </fieldset>

        <p
          role="status"
          aria-live="polite"
          class="mt-4 text-sm text-black/70"
        >
          <template v-if="isSoldOut">
            Esta prenda está agotada en todas las tallas.
          </template>

          <template v-else-if="selectedSize">
            Talla seleccionada:
            {{ selectedSize === 'TU' ? 'Única' : selectedSize }}.
          </template>

          <template v-else>
            Elige una talla disponible.
          </template>
        </p>

        <button
          type="button"
          data-testid="add-to-cart"
:disabled="!selectedSize || isSoldOut || checkingSession"          class="mt-8 w-full border-2 border-black bg-black px-6 py-4 font-bold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          @click="addToCart"
        >
{{ checkingSession ? 'Comprobando sesión…' : 'Añadir al carrito' }}          
        </button>
                <RouterLink
          to="/cart"
          class="mt-4 block text-center text-sm underline underline-offset-4"
        >
          Ver carrito
        </RouterLink>

        <p
          v-if="cartMessage"
          role="status"
          class="mt-4 text-sm text-green-800"
        >
          {{ cartMessage }}
        </p>

        <p
          v-if="cartError"
          role="alert"
          class="mt-4 text-sm text-red-700"
        >
          {{ cartError }}
        </p>
      </section>
    </div>
        <dialog
      ref="authDialog"
      aria-labelledby="auth-dialog-title"
      aria-describedby="auth-dialog-description"
      class="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md border border-black/15 bg-white p-8 text-black shadow-xl backdrop:bg-black/50"
    >
      <h2 id="auth-dialog-title" class="text-2xl font-bold">
        Tu cuenta Equisibé
      </h2>

      <p
        id="auth-dialog-description"
        class="mt-4 leading-relaxed text-black/70"
      >
        Inicia sesión o regístrate para añadir prendas al carrito y comprar.
      </p>

      <RouterLink
        to="/login"
        class="mt-6 block border-2 border-black bg-black px-5 py-3 text-center font-bold text-white"
        @click="authDialog.close()"
      >
        Iniciar sesión
      </RouterLink>

      <RouterLink
        to="/register"
        class="mt-3 block border-2 border-black px-5 py-3 text-center font-bold"
        @click="authDialog.close()"
      >
        Registrarme
      </RouterLink>

      <button
        type="button"
        class="mt-5 w-full text-center text-sm underline underline-offset-4"
        @click="authDialog.close()"
      >
        Seguir mirando
      </button>
    </dialog>
  </main>
</template>