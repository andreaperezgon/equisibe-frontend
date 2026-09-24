<script setup>
import TeamMember from '../components/about/TeamMember.vue'

const teamMembers = [
  {
    name: 'Pablo Álvarez',
    role: 'Sastrería y confección',
    description:
      'Apasionado por la confección y el trabajo artesanal, Pablo forma parte de Equisibé creando prendas cuidadas al detalle y adaptadas a cada persona.',
    reverse: false,
  },
  {
    name: 'Xeila González',
    role: 'Diseño y patronaje',
    description:
      'Xeila combina creatividad y técnica para transformar cada idea en una prenda única, trabajando desde el diseño y el patrón hasta los últimos detalles.',
    reverse: true,
  },
]
</script>

<template>
  <main>
    <!-- Introducción -->
    <section class="mx-auto max-w-7xl px-5 py-20 md:py-28">
      <p class="text-sm uppercase tracking-widest">
        Quiénes somos
      </p>

<h1 class="mt-4 text-4xl font-semibold md:text-6xl">
        Las personas detrás de Equisibé
      </h1>

<p class="mt-6 max-w-4xl leading-relaxed text-gray-600">
        Equisibé nace de la pasión por la confección, el patronaje
        y la sastrería hecha a medida.
      </p>
    </section>

    <!-- Equipo -->
    <section class="mx-auto max-w-7xl px-5 pb-20 md:pb-28">
      <div class="flex flex-col gap-20">
        <TeamMember
          v-for="member in teamMembers"
          :key="member.name"
          :name="member.name"
          :role="member.role"
          :description="member.description"
        :reverse="member.reverse"
          />

      </div>
    </section>
  </main>
</template>