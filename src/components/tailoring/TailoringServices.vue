<script setup>
const services = [
  {
    name: 'Traje de novio',
    description:
      'Chaqueta, chaleco y pantalón confeccionados a medida para una ocasión única.',
    price: 'Desde 1.200 €',
  },
  {
    name: 'Traje sastre de mujer',
    description:
      'Chaqueta y pantalón creados con patrón propio y adaptados a tus medidas.',
    price: 'Desde 620 €',
  },
  {
    name: 'Vestido de fiesta',
    description:
      'Diseños personalizados con tejidos, siluetas y acabados elegidos contigo.',
    price: 'Desde 540 €',
  },
  {
    name: 'Vestido de novia',
    description:
      'Diseño y confección artesanal de una prenda creada especialmente para ti.',
    price: 'Desde 1.450 €',
  },
  {
    name: 'Chaqueta a medida',
    description:
      'Americanas y chaquetas confeccionadas para conseguir un ajuste personalizado.',
    price: 'Desde 650 €',
  },
  {
    name: 'Camisa a medida',
    description:
      'Elige tejido, cuello y puños para crear una camisa adaptada a tus medidas.',
    price: 'Desde 95 €',
  },
]
</script>

<template>
  <section class="mx-auto max-w-7xl px-5 py-20 md:py-28">
    <p class="text-sm uppercase tracking-widest">
      Opciones y precios
    </p>

    <h2 class="mt-4 text-3xl font-semibold md:text-5xl">
      Qué puedes encargar
    </h2>

    <p class="mt-5 max-w-3xl leading-relaxed text-gray-600">
      Los precios son orientativos. El coste final depende del tejido,
      el diseño y los acabados elegidos.
    </p>

    <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="service in services"
        :key="service.name"
        to="/contact"
        class="group border border-black/15 bg-white/30 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/60 hover:shadow-md"
      >
        <h3 class="text-xl font-semibold">
          {{ service.name }}
        </h3>

        <div class="mt-5 h-px w-12 bg-black/40"></div>

        <p class="mt-5 text-sm leading-relaxed text-gray-600">
          {{ service.description }}
        </p>

        <p class="mt-8 font-semibold transition group-hover:translate-x-1">
          {{ service.price }}
        </p>
      </RouterLink>
    </div>
  </section>
</template>