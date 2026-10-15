<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useFavoriteStore } from '../../stores/favoriteStore'
import ProductCard from '../shop/ProductCard.vue'

const favorites = useFavoriteStore()
const loading = ref(true)
const error = ref('')

let active = true
let fetching = false

const loadFavorites = async () => {
  if (fetching) return

  fetching = true
  loading.value = true
  error.value = ''

  try {
    await favorites.load(true)
  } catch (failure) {
    if (!active) return

    error.value = [401, 403].includes(failure.response?.status)
      ? 'Inicia sesión de nuevo para consultar tus favoritos.'
      : 'No se pudieron cargar tus favoritos. Inténtalo de nuevo.'
  } finally {
    fetching = false
    if (active) loading.value = false
  }
}

onMounted(loadFavorites)
onBeforeUnmount(() => {
  active = false
})
</script>

<template>
  <section
    aria-labelledby="favorites-heading"
    class="mt-12 border-t border-black/20 pt-8"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 id="favorites-heading" class="text-2xl font-semibold">
        Mis favoritos
      </h2>

      <button
        type="button"
        :disabled="loading"
        :aria-busy="loading"
        class="text-sm underline underline-offset-4 disabled:opacity-40"
        @click="loadFavorites"
      >
        {{ loading ? 'Cargando…' : 'Actualizar favoritos' }}
      </button>
    </div>

    <p v-if="loading" role="status" class="mt-5">
      Cargando tus favoritos…
    </p>

    <div v-else-if="error" class="mt-5">
      <p role="alert" class="text-red-700">{{ error }}</p>
      <button
        type="button"
        class="mt-3 underline underline-offset-4"
        @click="loadFavorites"
      >
        Reintentar
      </button>
    </div>

    <div v-else-if="favorites.items.length === 0" class="mt-5">
      <p>Todavía no has guardado prendas en favoritos.</p>
      <RouterLink
        to="/shop"
        class="mt-3 inline-block underline underline-offset-4"
      >
        Explorar la tienda
      </RouterLink>
    </div>

    <div v-else class="mt-6 grid gap-8 sm:grid-cols-2">
      <ProductCard
        v-for="product in favorites.items"
        :key="product.id"
        :product="product"
      />
    </div>
  </section>
</template>
