<script setup>
import heroHome from '../../assets/hero-home.jpeg'
</script>

<template>
  <section class="relative min-h-[70vh] overflow-hidden">
    <!-- Imagen de fondo -->
    <img
      :src="heroHome"
      alt="Taller de confección Equisibé"
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- Capa oscura sobre la imagen -->
    <div class="absolute inset-0 bg-black/45"></div>

    <!-- Contenido del Hero -->
    <div class="relative z-10 flex min-h-[70vh] items-center">
      <div class="mx-auto w-full max-w-6xl px-5 py-20 text-white">

        <p class="text-sm uppercase tracking-widest">
          Taller de confección
        </p>

        <h1 class="mt-4 max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          Ropa hecha desde cero, a la medida de quien la lleva
        </h1>

        <p class="mt-6 max-w-xl text-base leading-relaxed">
          En Equisibé cortamos, cosemos y arreglamos. Trajes, vestidos y
          prendas de diario con patrón propio y acabados a mano.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            to="/shop"
            class="bg-white px-6 py-3 font-medium text-black transition hover:bg-gray-200"
          >
            Ver la tienda
          </RouterLink>

          <RouterLink
            to="/contact"
            class="border border-white px-6 py-3 font-medium text-white transition hover:bg-white hover:text-black"
          >
            Pedir cita
          </RouterLink>
        </div>

      </div>
    </div>
  </section>
</template>