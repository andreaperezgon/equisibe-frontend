<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { requestPasswordReset } from '../services/passwordResetService'

const email = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')

const submit = async () => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  error.value = ''

  try {
    const result = await requestPasswordReset(email.value)
    message.value = result.message
  } catch {
    error.value = 'No se pudo solicitar el enlace. Inténtalo más tarde.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-lg px-5 py-16">
    <h1 class="text-3xl">Recupera tu contraseña</h1>
    <p class="mt-4">Introduce tu correo y te enviaremos un enlace para cambiarla.</p>

    <form class="mt-8 grid gap-4" @submit.prevent="submit">
      <label for="recovery-email">Correo electrónico</label>
      <input
        id="recovery-email"
        v-model="email"
        type="email"
        autocomplete="email"
        maxlength="254"
        required
        class="w-full border p-3"
      >
      <button
        type="submit"
        :disabled="busy"
        class="bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {{ busy ? 'Enviando…' : 'Enviar enlace' }}
      </button>
    </form>

    <p v-if="message" role="status" class="mt-5">{{ message }}</p>
    <p v-if="error" role="alert" class="mt-5 text-red-700">{{ error }}</p>
    <RouterLink to="/login" class="mt-6 inline-block underline">
      Volver a iniciar sesión
    </RouterLink>
  </main>
</template>
