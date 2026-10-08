<script setup>
import { RouterLink } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
</script>

<template>
  <main class="mx-auto w-full max-w-lg px-5 py-16">
    <h1 class="text-3xl font-semibold">Inicia sesión</h1>
    <p class="mt-3 mb-8">Accede a tu cuenta de Equisibé.</p>

    <LoginForm />

    <p class="mt-6 text-center text-sm">
      ¿Todavía no tienes cuenta?
      <RouterLink to="/register" class="font-bold underline">
        Regístrate
      </RouterLink>
    </p>
  </main>
</template>