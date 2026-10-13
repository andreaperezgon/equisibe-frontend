<script setup>
import ContactForm from '../components/contact/ContactForm.vue'

const mapsUrl =
  'https://www.google.com/maps/place//data=!4m2!3m1!1s0xd368d1236c8e8c9:0xf185398270e51f87'

const mapEmbedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2900.7971425366354!2d-5.845225!3d43.3603537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd368d1236c8e8c9%3A0xf185398270e51f87!2zRXF1aXNpYsOp!5e0!3m2!1ses-419!2ses!4v1791876196052!5m2!1ses-419!2ses'
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

      <section
        aria-labelledby="location-title"
        class="min-w-0"
      >
        <h2 id="location-title" class="text-2xl font-semibold">
          Ven a conocernos
        </h2>

        <address class="mt-4 not-italic leading-relaxed text-gray-600">
          Plaza de la Constitución, 3, 3.º<br />
          33009 Oviedo, Asturias
        </address>

        <p class="mt-3 text-sm text-gray-600">
          Atención con cita previa.
        </p>

        <div class="mt-6 overflow-hidden border border-black/15">
          <iframe
            :src="mapEmbedUrl"
            title="Ubicación de Equisibé en Plaza de la Constitución, Oviedo"
            width="600"
            height="450"
            class="block h-80 w-full border-0 md:h-96"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>

        <a
          :href="mapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-5 inline-block text-sm underline underline-offset-4"
        >
          Abrir en Google Maps
          <span class="sr-only">(se abre en otra pestaña)</span>
        </a>
      </section>
    </div>
  </main>
</template>