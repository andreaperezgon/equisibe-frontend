<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await loginUser({
      email: form.email.trim(),
      password: form.password,
    })

    await authStore.fetchCurrentUser()

    if (!authStore.isAuthenticated) {
      errorMessage.value = 'No se pudo recuperar la sesión. Inténtalo de nuevo.'
      return
    }

    form.password = ''
    await router.replace('/account')
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

    <button
      type="submit"
      :disabled="isSubmitting"
      class="mt-6 w-full border-2 border-black px-5 py-3 font-bold transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      {{ isSubmitting ? 'Entrando…' : 'Iniciar sesión' }}
    </button>
  </form>
</template>