<script setup>
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <main class="mx-auto w-full max-w-lg px-5 py-16">
    <h1 class="text-3xl font-semibold">Mi cuenta</h1>

    <div v-if="authStore.user" class="mt-8 space-y-4">
      <p>Hola, {{ authStore.user.name }}</p>
      <p>{{ authStore.user.email }}</p>
    </div>
  </main>
</template>