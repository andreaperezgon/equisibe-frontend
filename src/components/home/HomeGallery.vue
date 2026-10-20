<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { homeGalleryImages } from '../../data/homeGalleryImages'

const current = ref(0)
const images = homeGalleryImages
const visibleImages = computed(() =>
  Array.from({ length: Math.min(3, images.length) }, (_, offset) =>
    images[(current.value + offset) % images.length],
  ),
)
let touchStart = null

function move(direction) {
  if (images.length < 2) return
  current.value = (current.value + direction + images.length) % images.length
}
function keyboard(event) {
  if (event.target !== event.currentTarget) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    move(-1)
  }
}
function startTouch(event) {
  const touch = event.touches?.[0]
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null
}
function endTouch(event) {
  const touch = event.changedTouches?.[0]
  if (!touchStart || !touch) return
  const dx = touch.clientX - touchStart.x
  const dy = touch.clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
}
</script>

<template>
  <section
    class="editorial-gallery mx-auto max-w-6xl px-5 py-20 outline-offset-8 md:py-28"
    aria-labelledby="home-gallery-title"
    aria-roledescription="carrusel"
    tabindex="0"
    @keydown="keyboard"
  >
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest">Nuestro trabajo</p>
      <h2 id="home-gallery-title" class="mt-4 text-4xl font-semibold md:text-5xl">
        Hecho a mano, pieza a pieza
      </h2>
      <p class="mx-auto mt-5 max-w-2xl leading-relaxed">
        Una selección de prendas y detalles realizados en nuestro taller.
      </p>
    </div>
    <div
      class="gallery-grid mt-12"
      @touchstart.passive="startTouch"
      @touchend.passive="endTouch"
      @touchcancel.passive="touchStart = null"
    >
      <figure
        v-for="image in visibleImages"
        :key="image.src"
        class="gallery-card m-0 overflow-hidden bg-white/40"
      >
        <img
          :src="image.src"
          :alt="image.alt"
          width="600"
          height="800"
          loading="lazy"
          decoding="async"
          draggable="false"
          class="aspect-[3/4] h-full w-full object-contain"
        />
      </figure>
    </div>
    <div class="mt-6 flex items-center justify-center gap-6">
      <button
        type="button"
        aria-label="Ver fotografía anterior"
        :disabled="images.length < 2"
        class="flex h-11 w-11 items-center justify-center border border-current text-2xl transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-40"
        @click="move(-1)"
      >
        <span aria-hidden="true">←</span>
      </button>
      <p class="min-w-20 text-center text-sm" role="status" aria-live="polite" aria-atomic="true">
        <span class="sr-only">Fotografía inicial del grupo:</span>
        {{ current + 1 }} / {{ images.length }}
      </p>
      <button
        type="button"
        aria-label="Ver fotografía siguiente"
        :disabled="images.length < 2"
        class="flex h-11 w-11 items-center justify-center border border-current text-2xl transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-40"
        @click="move(1)"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
    <div class="mt-10 text-center">
      <RouterLink
        to="/tailoring"
        class="inline-block border-b border-current pb-1 font-semibold transition hover:opacity-60"
      >
        Ver a medida →
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  touch-action: pan-y;
}
.gallery-card:not(:first-child) { display: none; }
@media (min-width: 640px) {
  .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gallery-card:nth-child(2) { display: block; }
}
@media (min-width: 1024px) {
  .gallery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gallery-card:nth-child(3) { display: block; }
}
</style>
<style scoped>

/* gallery-photo-crop:start */
.gallery-card {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}
.gallery-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 350ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .gallery-card:hover img {
    transform: scale(1.05);
  }
}
@media (prefers-reduced-motion: reduce) {
  .gallery-card img {
    transition: none;
  }
  .gallery-card:hover img {
    transform: none;
  }
}
/* gallery-photo-crop:end */

</style>
