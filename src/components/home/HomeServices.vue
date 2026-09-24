<script setup>
const services = [
  {
    title: 'Confección desde cero',
    description:
      'Elegimos juntos el tejido, tomamos medidas y creamos el patrón desde el papel. Cada prenda nace para un cuerpo concreto, con dos o tres pruebas hasta el ajuste perfecto.',
  },
  {
    title: 'Trajes y vestidos de ceremonia',
    description:
      'Novios, novias, madrinas e invitados. Trabajamos lanas frías, sedas, crepés y tules con acabados a mano: ojales, forros y bordados cosidos uno a uno.',
  },
  
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
    <div
      class="mx-auto grid max-w-4xl gap-10 border-t border-gray-200 pt-14 md:grid-cols-2"
    >
      <article
        v-for="service in services"
        :key="service.title"
        class="text-center"
      >
        <h3 class="text-2xl font-semibold">
          {{ service.title }}
        </h3>

        <p class="mt-5 text-sm leading-relaxed text-gray-600">
          {{ service.description }}
        </p>
      </article>
    </div>
  </section>
</template>