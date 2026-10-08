<script setup>
import { reactive, ref } from 'vue'
import { loginUser } from '../../services/authService'

const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await loginUser({
      email: form.email.trim(),
      password: form.password,
    })

    form.password = ''
    successMessage.value = 'Has iniciado sesión correctamente.'
  } catch (error) {
    errorMessage.value =
      error.response?.data?.detail ||
      'No se pudo iniciar sesión. Inténtalo de nuevo.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label for="loginEmail">Correo electrónico</label>
    <input
      id="loginEmail"
      v-model="form.email"
      type="email"
      autocomplete="username"
      required
      class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
    />

    <label for="loginPassword" class="mt-5 block">Contraseña</label>
    <input
      id="loginPassword"
      v-model="form.password"
      type="password"
      autocomplete="current-password"
      required
      class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
    />

    <p v-if="errorMessage" role="alert" class="mt-4 text-sm text-red-700">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" role="status" class="mt-4 text-sm text-green-700">
      {{ successMessage }}
    </p>

    <button
      type="submit"
      :disabled="isSubmitting"
      class="mt-6 w-full border-2 border-black px-5 py-3 font-bold transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      {{ isSubmitting ? 'Entrando…' : 'Iniciar sesión' }}
    </button>
  </form>
</template>