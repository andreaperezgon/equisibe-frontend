<script setup>
import ContactForm from '../components/contact/ContactForm.vue'
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 py-16 md:py-24">
    <section>
      <p class="text-sm uppercase tracking-widest">
        Contáctanos
      </p>

      <h1 class="mt-4 text-4xl font-semibold md:text-6xl">
        Hablemos de tu prenda
      </h1>

      <p class="mt-5 max-w-2xl leading-relaxed text-gray-600">
        Escríbenos a través del formulario y cuéntanos qué tienes en mente.
        Atendemos con cita previa para dedicar a cada proyecto el tiempo que
        necesita.
      </p>
    </section>

    <div class="mt-14 grid gap-12 lg:grid-cols-2">
      <ContactForm />

      <!-- Datos de contacto y mapa: lo haremos después -->
      <div class="min-h-96 border border-black/15"></div>
    </div>
  </main>
</template>