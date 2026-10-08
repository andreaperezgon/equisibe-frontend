<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const router = useRouter()
const isLoggingOut = ref(false)
const errorMessage = ref('')

const handleLogout = async () => {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  errorMessage.value = ''

  try {
    await authStore.logout()
    await router.replace('/login')
  } catch {
    errorMessage.value = 'No se pudo cerrar la sesión. Inténtalo de nuevo.'
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-lg px-5 py-16">
    <h1 class="text-3xl font-semibold">Mi cuenta</h1>

    <div v-if="authStore.user" class="mt-8 space-y-4">
      <p>Hola, {{ authStore.user.name }}</p>
      <p>{{ authStore.user.email }}</p>

      <button
        type="button"
        :disabled="isLoggingOut"
        class="border-2 border-black px-5 py-3 font-bold transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
        @click="handleLogout"
      >
        {{ isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}
      </button>
    </div>

    <p v-if="errorMessage" role="alert" class="mt-4 text-sm text-red-700">
      {{ errorMessage }}
    </p>
  </main>
</template>