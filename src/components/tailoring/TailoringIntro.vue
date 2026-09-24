<script setup>
import tailoringImage from '../../assets/tailoring1.jpeg'
</script>
<template>
  <section class="mx-auto max-w-7xl px-5 py-20 md:py-28">
    <div class="grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
      
      <div>
        <p class="text-sm uppercase tracking-widest">
          Cómo trabajamos
        </p>

        <h2 class="mt-4 text-3xl font-semibold md:text-5xl">
          De la primera cita a la entrega
        </h2>

        <p class="mt-6 leading-relaxed text-gray-600">
          Hacemos pocas prendas al mes y nos tomamos el tiempo que cada traje
          necesita. El proceso incluye patronaje, corte a mano, varias pruebas
          y acabados a mano.
        </p>

        <p class="mt-4 leading-relaxed text-gray-600">
          También podemos partir de una prenda que te siente especialmente
          bien y utilizarla como referencia para crear nuevas piezas.
        </p>
      </div>

<img
  :src="tailoringImage"
  alt="Prenda de Equisibé durante el proceso de confección"
  class="mx-auto w-full max-w-md object-cover md:max-h-[650px]"
/>
    </div>
  </section>
</template>