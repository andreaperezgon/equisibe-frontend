<script setup>
import { computed, onMounted, ref } from 'vue'
import ProductCard from '../components/shop/ProductCard.vue'
import { getProducts } from '../services/productService'

const products = ref([])
const selectedCategory = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

const categories = computed(() =>
  [...new Set(products.value.map((product) => product.category))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es')),
)

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value

  return products.value.filter(
    (product) => product.category === selectedCategory.value,
  )
})

const loadProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    products.value = await getProducts()

    if (!categories.value.includes(selectedCategory.value)) {
      selectedCategory.value = ''
    }
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
    <h1 class="text-3xl md:text-4xl">
      Tienda
    </h1>

    <p class="mt-3 text-black/70">
      Descubre las prendas de Equisibé.
    </p>

    <p v-if="isLoading" role="status" class="mt-10">
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

    <template v-else>
      <div
        class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <label for="category-filter" class="block text-sm font-bold">
            Filtrar por categoría
          </label>

          <select
            id="category-filter"
            v-model="selectedCategory"
            class="mt-2 w-full border border-black/30 bg-transparent px-4 py-3 sm:w-64"
          >
            <option value="">
              Todas las categorías
            </option>

            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <p role="status" aria-live="polite" class="text-sm text-black/60">
          {{ filteredProducts.length }}
          {{ filteredProducts.length === 1 ? 'prenda' : 'prendas' }}
        </p>
      </div>

      <div
        class="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </template>
  </main>
</template>