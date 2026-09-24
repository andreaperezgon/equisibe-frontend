<script setup>
const steps = [
  {
    number: '01',
    title: 'Primera toma de contacto',
    description:
      'Hablamos sobre la prenda que tienes en mente, el estilo que buscas y la ocasión para la que está pensada.',
  },
  {
    number: '02',
    title: 'Medidas y elección de tejido',
    description:
      'Tomamos tus medidas y seleccionamos tejidos, colores y acabados para definir cada detalle de la prenda.',
  },
  {
    number: '03',
    title: 'Pruebas y ajustes',
    description:
      'Realizamos las pruebas necesarias para ajustar la prenda a tu cuerpo y conseguir el resultado que buscamos.',
  },
  {
    number: '04',
    title: 'Entrega de la prenda',
    description:
      'Terminamos los últimos detalles y entregamos una prenda confeccionada especialmente para ti.',
  },
]
</script>

<template>
  <section class="mx-auto max-w-7xl px-5 pb-20 md:pb-28">
    <div class="border-t border-black/20 pt-14">
      <p class="text-sm uppercase tracking-widest">
        El proceso
      </p>

      <h2 class="mt-4 text-3xl font-semibold md:text-5xl">
        De la idea a la prenda terminada
      </h2>

      <div class="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="step in steps"
          :key="step.number"
        >
          <p class="text-sm font-bold">
            {{ step.number }}
          </p>

          <h3 class="mt-4 text-xl font-semibold">
            {{ step.title }}
          </h3>

          <p class="mt-4 text-sm leading-relaxed text-gray-600">
            {{ step.description }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>