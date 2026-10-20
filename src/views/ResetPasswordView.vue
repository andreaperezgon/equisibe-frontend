<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { resetPassword } from '../services/passwordResetService'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const confirmation = ref('')
const busy = ref(false)
const done = ref(false)
const error = ref('')

onMounted(() => {
  if (route.query.token) {
    router.replace({ path: route.path, query: {}, hash: route.hash })
  }
})

const submit = async () => {
  if (busy.value || done.value) return
  error.value = ''

  if (password.value !== confirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  if (password.value.length < 8 || password.value.length > 64) {
    error.value = 'La contraseña debe tener entre 8 y 64 caracteres.'
    return
  }

  busy.value = true

  try {
    await resetPassword(token.value, password.value)
    auth.user = null
    auth.isSessionChecked = true
    token.value = ''
    password.value = ''
    confirmation.value = ''
    done.value = true
  } catch (failure) {
    error.value = failure.response?.status === 400
      ? 'El enlace ha caducado o ya se utilizó. Solicita uno nuevo.'
      : 'No se pudo cambiar la contraseña. Inténtalo más tarde.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="workspace-page workspace-recovery mx-auto w-full max-w-lg px-5 py-16">
    <h1 class="text-3xl">Nueva contraseña</h1>

    <div v-if="done" class="mt-6">
      <p role="status">Contraseña actualizada. Ya puedes iniciar sesión.</p>
      <RouterLink to="/login" class="mt-5 inline-block underline">
        Iniciar sesión
      </RouterLink>
    </div>

    <template v-else>
      <form v-if="token" class="mt-8 grid gap-4" @submit.prevent="submit">
        <label for="new-password">Nueva contraseña</label>
        <input
          id="new-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="64"
          required
          class="w-full border p-3"
        >
        <p class="text-sm">Entre 8 y 64 caracteres.</p>

        <label for="confirm-password">Repite la contraseña</label>
        <input
          id="confirm-password"
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="64"
          required
          class="w-full border p-3"
        >
        <button
          type="submit"
          :disabled="busy"
          class="bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {{ busy ? 'Guardando…' : 'Guardar contraseña' }}
        </button>
      </form>

      <p v-else class="mt-6">Necesitas un enlace de recuperación válido.</p>
      <p v-if="error" role="alert" class="mt-5 text-red-700">{{ error }}</p>

      <RouterLink to="/forgot-password" class="mt-6 inline-block underline">
        Solicitar otro enlace
      </RouterLink>
    </template>
  </main>
</template>
