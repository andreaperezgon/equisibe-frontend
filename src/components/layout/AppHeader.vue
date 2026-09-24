<script setup>
import { ref } from 'vue'
import headerLogo from '../../assets/header.png'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="border-b border-black/10">
    <!-- Barra principal -->
    <div class="flex w-full items-center justify-between px-5 py-4 md:px-8">

      <!-- Logo -->
      <RouterLink
        to="/"
        class="shrink-0"
        @click="closeMenu"
      >
        <img
          :src="headerLogo"
          alt="Equisibé"
          class="h-10 w-auto object-contain md:h-12"
        />
      </RouterLink>

      <!-- Navegación escritorio -->
      <nav class="hidden items-center gap-14 lg:flex">
        <RouterLink
          to="/"
          class="font-bold transition hover:opacity-60"
        >
          Inicio
        </RouterLink>

        <RouterLink
          to="/about"
          class="font-bold transition hover:opacity-60"
        >
          Quiénes somos
        </RouterLink>

        <RouterLink
          to="/tailoring"
          class="font-bold transition hover:opacity-60"
        >
          Sastrería a medida
        </RouterLink>

        <RouterLink
          to="/shop"
          class="font-bold transition hover:opacity-60"
        >
          Tienda
        </RouterLink>

        <RouterLink
          to="/contact"
          class="font-bold transition hover:opacity-60"
        >
          Contáctanos
        </RouterLink>
      </nav>

      <!-- Usuario y cesta escritorio -->
      <div class="hidden items-center gap-5 lg:flex">
        <RouterLink
          to="/login"
          class="border-2 border-black px-5 py-2 text-sm font-bold transition hover:bg-black hover:text-white"
        >
          Iniciar sesión / Regístrate
        </RouterLink>

        <RouterLink
          to="/cart"
          aria-label="Ver cesta"
          class="transition hover:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-7 w-7"
          >
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path
              d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"
            />
          </svg>
        </RouterLink>
      </div>

      <!-- Botón hamburguesa móvil y tablet -->
      <button
        type="button"
        class="flex flex-col gap-1.5 lg:hidden"
        :aria-label="isMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleMenu"
      >
        <span class="h-0.5 w-7 bg-black"></span>
        <span class="h-0.5 w-7 bg-black"></span>
        <span class="h-0.5 w-7 bg-black"></span>
      </button>
    </div>

    <!-- Menú móvil y tablet -->
    <nav
      v-if="isMenuOpen"
      class="flex flex-col border-t border-black/10 px-5 py-6 lg:hidden"
    >
      <div class="flex flex-col gap-5">
        <RouterLink
          to="/"
          class="font-bold"
          @click="closeMenu"
        >
          Inicio
        </RouterLink>

        <RouterLink
          to="/about"
          class="font-bold"
          @click="closeMenu"
        >
          Quiénes somos
        </RouterLink>

        <RouterLink
          to="/tailoring"
          class="font-bold"
          @click="closeMenu"
        >
          Sastrería a medida
        </RouterLink>

        <RouterLink
          to="/shop"
          class="font-bold"
          @click="closeMenu"
        >
          Tienda
        </RouterLink>

        <RouterLink
          to="/contact"
          class="font-bold"
          @click="closeMenu"
        >
          Contáctanos
        </RouterLink>
      </div>

      <div class="mt-6 flex items-center gap-5 border-t border-black/10 pt-6">
        <RouterLink
          to="/login"
          class="border-2 border-black px-5 py-2 text-sm font-bold"
          @click="closeMenu"
        >
          Iniciar sesión / Regístrate
        </RouterLink>

        <RouterLink
          to="/cart"
          aria-label="Ver cesta"
          class="transition hover:opacity-60"
          @click="closeMenu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-7 w-7"
          >
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path
              d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"
            />
          </svg>
        </RouterLink>
      </div>
    </nav>
  </header>
</template>