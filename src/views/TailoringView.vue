<script setup>
import TailoringProcess from '../components/tailoring/TailoringProcess.vue'
import TailoringServices from '../components/tailoring/TailoringServices.vue'
</script>
<template>
  <main>
    <section class="mx-auto max-w-7xl px-5 py-20 md:py-28">
      <p class="text-sm uppercase tracking-widest">
        Sastrería a medida
      </p>

      <h1 class="mt-4 text-4xl font-semibold md:text-6xl">
        Una prenda creada para ti
      </h1>

      <p class="mt-6 max-w-4xl leading-relaxed text-gray-600">
        Desde la elección del tejido hasta la última prueba, cada prenda
        se confecciona de forma personalizada y cuidando cada detalle.
      </p>
    </section>
    <TailoringProcess />
    <TailoringServices />
  </main>
</template>