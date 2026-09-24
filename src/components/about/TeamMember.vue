<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  reverse: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <article class="grid gap-8 md:grid-cols-2 md:items-center">
    <!-- Foto -->
    <div
      class="aspect-[4/5] overflow-hidden bg-white/40"
      :class="{ 'md:order-2': reverse }"
    >
      <img
        v-if="image"
        :src="image"
        :alt="name"
        class="h-full w-full object-cover"
      />
    </div>

    <!-- Información -->
    <div :class="{ 'md:order-1': reverse }">
      <p class="text-sm uppercase tracking-widest">
        {{ role }}
      </p>

      <h2 class="mt-3 text-3xl font-semibold md:text-4xl">
        {{ name }}
      </h2>

      <p class="mt-5 leading-relaxed text-gray-600">
        {{ description }}
      </p>
    </div>
  </article>
</template>