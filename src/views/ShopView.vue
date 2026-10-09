<script setup>
import { onMounted, ref } from 'vue'
import ProductCard from '../components/shop/ProductCard.vue'
import { getProducts } from '../services/productService'

const products = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const loadProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    products.value = await getProducts()
  } catch {
    errorMessage.value =
      'No se pudo cargar la tienda. Inténtalo de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProducts)
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
    <h1 class="text-3xl md:text-4xl">Tienda</h1>

    <p class="mt-3 text-black/70">
      Descubre las prendas de Equisibé.
    </p>

    <p
      v-if="isLoading"
      role="status"
      class="mt-10"
    >
      Cargando prendas…
    </p>

    <div v-else-if="errorMessage" class="mt-10">
      <p role="alert" class="text-red-700">
        {{ errorMessage }}
      </p>

      <button
        type="button"
        class="mt-4 border-2 border-black px-5 py-2 font-bold transition hover:bg-black hover:text-white"
        @click="loadProducts"
      >
        Reintentar
      </button>
    </div>

    <p
      v-else-if="products.length === 0"
      role="status"
      class="mt-10"
    >
      Todavía no hay prendas disponibles.
    </p>

    <div
      v-else
class="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </main>
</template>