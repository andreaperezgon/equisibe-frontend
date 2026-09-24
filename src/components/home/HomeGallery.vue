<template>
  <section class="mx-auto max-w-6xl px-5 py-20 md:py-28">
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest">
        Nuestro trabajo
      </p>

      <h2 class="mt-4 text-4xl font-semibold md:text-5xl">
        Hecho a mano, pieza a pieza
      </h2>

      <p class="mx-auto mt-5 max-w-2xl leading-relaxed">
        Una selección de prendas y detalles realizados en nuestro taller.
      </p>
    </div>

    <!-- Galería -->
    <div class="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div
        v-for="image in 4"
        :key="image"
        class="aspect-[3/4] bg-white/40"
      ></div>
    </div>

    <!-- Enlace a sastrería -->
    <div class="mt-10 text-center">
      <RouterLink
        to="/tailoring"
        class="inline-block border-b border-current pb-1 font-semibold transition hover:opacity-60"
      >
        Ver sastrería a medida →
      </RouterLink>
    </div>
  </section>
</template>