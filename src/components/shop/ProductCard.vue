<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const sizes = computed(() =>
  Object.prototype.hasOwnProperty.call(
    props.product.stockBySize ?? {},
    'TU',
  )
    ? ['TU']
    : ['S', 'M', 'L', 'XL'],
)
const imageFailed = ref(false)

const formattedPrice = computed(() =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(props.product.price),
)

const isSizeAvailable = (size) =>
  (props.product.stockBySize?.[size] ?? 0) > 0
</script>

<template>
  <article>
    <RouterLink
      :to="`/shop/${product.id}`"
      class="group block"
    >
      <div
        class="flex aspect-[3/4] items-center justify-center overflow-hidden bg-black/5"
      >
        <img
          v-if="product.imageUrl && !imageFailed"
          :src="product.imageUrl"
          :alt="product.name"
          loading="lazy"
          class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          @error="imageFailed = true"
        />

        <span v-else class="px-4 text-center text-sm text-black/60">
          Imagen no disponible
        </span>
      </div>

      <div class="mt-4 flex items-start justify-between gap-4">
        <h2 class="font-bold">
          {{ product.name }}
        </h2>

        <p class="shrink-0">
          {{ formattedPrice }}
        </p>
      </div>

      <p class="mt-1 text-sm text-black/60">
        {{ product.category }}
      </p>
    </RouterLink>

    <ul
      aria-label="Disponibilidad por talla"
      class="mt-3 flex gap-2"
    >
      <li
        v-for="size in sizes"
        :key="size"
        :aria-label="`${size}: ${isSizeAvailable(size) ? 'disponible' : 'agotada'}`"
        :class="
          isSizeAvailable(size)
            ? 'border-black/40'
            : 'border-black/10 text-black/30 line-through'
        "
        class="flex h-8 min-w-8 items-center justify-center border px-2 text-xs"
      >
        {{ size }}
      </li>
    </ul>
  </article>
</template>