<script setup>
import footerLogo from '../../assets/footer.png'
</script>

<template>
  <footer class="border-t border-black/10 px-6 py-8">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between"
    >
      <img
        :src="footerLogo"
        alt="Equisibé"
        class="w-36"
      />

      <nav class="flex flex-wrap gap-6 text-base font-semibold">
        <RouterLink to="/" class="transition hover:opacity-60">
          Inicio
        </RouterLink>

        <RouterLink to="/about" class="transition hover:opacity-60">
          Nosotros
        </RouterLink>

        <RouterLink to="/tailoring" class="transition hover:opacity-60">
          Sastrería
        </RouterLink>

        <RouterLink to="/contact" class="transition hover:opacity-60">
          Contacto
        </RouterLink>
      </nav>

      <div class="flex items-center gap-5">
        <a
          href="https://www.instagram.com/equisibe/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de Equisibé"
          class="transition hover:opacity-60"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>

        <p class="text-base font-semibold text-black/50">
          © 2026 Equisibé
        </p>
      </div>
    </div>
  </footer>
</template>