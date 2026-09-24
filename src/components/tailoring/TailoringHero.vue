<script setup>
import tailoringHero from '../../assets/tailoring-hero.png'
</script>

<template>
  <section class="relative min-h-[55vh] overflow-hidden md:min-h-[70vh]">
    <!-- Imagen -->
<img
  :src="tailoringHero"
  alt="Taller de sastrería a medida"
  class="absolute inset-0 h-full w-full object-cover"
/>

<!-- Capa oscura -->
<div class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 flex min-h-[55vh] items-center md:min-h-[70vh]">
      <div class="mx-auto w-full max-w-7xl px-5 text-white">
        <p class="text-sm uppercase tracking-widest text-white/80">
          Sastrería a medida
        </p>

        <h1 class="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-7xl">
          Trajes y chaquetas con tu patrón propio
        </h1>

        <p class="mt-6 max-w-xl leading-relaxed text-white/85">
          Cada prenda se dibuja, se corta y se cose a partir de tu cuerpo.
          Nada de tallas estándar: tú eliges los tejidos y nosotros cuidamos
          cada detalle.
        </p>

        <RouterLink
          to="/contact"
          class="mt-8 inline-block bg-white px-7 py-3 font-bold text-black transition hover:bg-gray-200"
        >
          Pedir cita
        </RouterLink>
      </div>
    </div>
  </section>
</template>