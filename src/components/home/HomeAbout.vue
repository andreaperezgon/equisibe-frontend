<script setup>
import rolloTela from '../../assets/rollo-tela.jpeg'
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 py-20 md:py-28">
    <div class="grid gap-12 md:grid-cols-2 md:items-center">

      <div>
        <p class="text-sm uppercase tracking-widest">
          Qué hacemos
        </p>

        <h2 class="mt-4 text-4xl font-semibold md:text-5xl">
          Del rollo de tela a la prenda terminada
        </h2>

        <p class="mt-6 leading-relaxed text-gray-600">
          Todo empieza con una conversación y una cinta métrica. Dibujamos
          el patrón sobre papel, cortamos la tela a mano y montamos la prenda
          en el taller, sin producción en serie ni tallas estándar.
        </p>

        <p class="mt-4 leading-relaxed text-gray-600">
          Después vienen las pruebas: ahí es donde una prenda deja de quedar
          bien y empieza a quedar perfecta.
        </p>
      </div>

      <div class="overflow-hidden">
        <img
          :src="rolloTela"
          alt="Proceso de confección en el taller Equisibé"
          class="h-full w-full object-cover"
        />
      </div>

    </div>
  </section>
</template>