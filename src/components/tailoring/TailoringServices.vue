<script setup>
const services = [
  {
    name: 'Traje a medida',
    price: 'Desde 450 €',
  },
  {
    name: 'Americana a medida',
    price: 'Desde 280 €',
  },
  {
    name: 'Pantalón a medida',
    price: 'Desde 120 €',
  },
  {
    name: 'Camisa a medida',
    price: 'Desde 90 €',
  },
  {
    name: 'Vestido a medida',
    price: 'Desde 300 €',
  },
  {
    name: 'Prendas para ceremonia',
    price: 'Consultar',
  },
]
</script>

<template>
  <section class="mx-auto max-w-7xl px-5 pb-20 md:pb-28">
    <div class="border-t border-black/20 pt-14">
      <p class="text-sm uppercase tracking-widest">
        Servicios
      </p>

      <h2 class="mt-4 text-3xl font-semibold md:text-5xl">
        Sastrería hecha para ti
      </h2>

      <p class="mt-5 max-w-3xl leading-relaxed text-gray-600">
        Cada proyecto es diferente. Estos precios son orientativos y pueden
        variar según el tejido, el diseño y los acabados elegidos.
      </p>

      <div class="mt-12 grid gap-x-12 md:grid-cols-2">
        <div
          v-for="service in services"
          :key="service.name"
          class="flex items-center justify-between border-b border-black/20 py-5"
        >
          <span class="font-semibold">
            {{ service.name }}
          </span>

          <span class="text-sm text-gray-600">
            {{ service.price }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>