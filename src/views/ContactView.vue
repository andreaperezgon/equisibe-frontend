<script setup>
import ContactForm from '../components/contact/ContactForm.vue'

const mapsUrl =
  'https://www.google.com/maps/place//data=!4m2!3m1!1s0xd368d1236c8e8c9:0xf185398270e51f87'

const mapEmbedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2900.7971425366354!2d-5.845225!3d43.3603537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd368d1236c8e8c9%3A0xf185398270e51f87!2zRXF1aXNpYsOp!5e0!3m2!1ses-419!2ses!4v1791876196052!5m2!1ses-419!2ses'
</script>

<template>
  <main class="contact-page mx-auto max-w-7xl px-5 py-16 md:py-24">
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
      
      <section class="contact-form-card" aria-labelledby="contact-form-heading">
        <p class="contact-eyebrow">Estamos al otro lado</p>
        <h2 id="contact-form-heading">Cuéntanos tu idea</h2>
        <p class="contact-form-intro">
          Una duda, una prenda especial o ese proyecto que tienes en mente.
        </p>
        <ContactForm />
      </section>

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
<style scoped>

/* contact-refresh:start */
.contact-page {
  width: 100%;
  max-width: 1180px;
  padding: 48px 28px 64px;
}
.contact-page > section:first-child > p:first-child,
.contact-eyebrow {
  color: #53616a;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.contact-page h1 {
  max-width: 780px;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 500;
  line-height: 1.5;
}
.contact-page > section:first-child > p:last-child {
  max-width: 680px;
  color: #53616a;
  font-size: 16px;
  line-height: 1.9;
}
.contact-page > div {
  gap: 26px;
  align-items: start;
  margin-top: 36px;
}
.contact-form-card,
.contact-page section[aria-labelledby="location-title"] {
  min-width: 0;
  padding: 30px;
  border: 1px solid #d8dddf;
  border-radius: 7px;
  background: #f8f7f4;
}
.contact-page h2 {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.6;
}
.contact-form-intro {
  margin: 14px 0 28px;
  color: #53616a;
  font-size: 15px;
  line-height: 1.9;
}
.contact-page :deep(form label) {
  color: #37434a;
  font-size: 15px;
  font-weight: 500;
}
.contact-page :deep(form input),
.contact-page :deep(form textarea) {
  padding: 12px 14px;
  border: 1px solid #cbd3d6;
  border-radius: 4px;
  background: #fcfcfa;
  color: #28383f;
  font-size: 16px;
}
.contact-page :deep(form textarea) {
  min-height: 160px;
  resize: vertical;
}
.contact-page :deep(form input:focus-visible),
.contact-page :deep(form textarea:focus-visible) {
  outline: 2px solid #738b96;
  outline-offset: 2px;
}
.contact-page :deep(form button[type="submit"]) {
  min-height: 46px;
  border: 1px solid #c3d2d8;
  border-radius: 4px;
  background: #e2eaed;
  color: #28383f;
  font-size: 15px;
  font-weight: 500;
}
.contact-page :deep(form button[type="submit"]:hover:not(:disabled)) {
  background: #d3e0e5;
  color: #28383f;
}
.contact-page :deep(#contact-privacy-notice) {
  font-size: 13px;
  line-height: 1.8;
}
.contact-page address {
  color: #53616a;
  font-size: 15px;
  line-height: 1.9;
}
.contact-page section[aria-labelledby="location-title"] > div {
  overflow: hidden;
  border: 1px solid #d8dddf;
  border-radius: 5px;
}
.contact-page section[aria-labelledby="location-title"] > a {
  color: #425963;
  font-size: 14px;
}
.contact-page a:focus-visible,
.contact-page :deep(button:focus-visible) {
  outline: 2px solid #738b96;
  outline-offset: 4px;
}
@media (max-width: 600px) {
  .contact-page {
    padding: 28px 16px 40px;
  }
  .contact-form-card,
  .contact-page section[aria-labelledby="location-title"] {
    padding: 24px 20px;
  }
  .contact-page h2 {
    font-size: 22px;
  }
}
/* contact-refresh:end */

</style>
