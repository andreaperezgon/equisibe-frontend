<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '../../services/authService'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errorMessage = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''

  if (!form.name.trim()) {
    errorMessage.value = 'Introduce tu nombre.'
    return
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }

  isSubmitting.value = true

  try {
    await registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    })
  } catch (error) {
    errorMessage.value =
      error.response?.data?.detail ||
      'No se pudo crear la cuenta. Inténtalo de nuevo.'

    isSubmitting.value = false
    return
  }

  form.password = ''
  form.confirmPassword = ''

  try {
    await router.replace('/login')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label for="name" class="block">Nombre</label>
    <input
      id="name"
      v-model="form.name"
      type="text"
      autocomplete="name"
      required
      class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
    />

    <label for="email" class="mt-5 block">Correo electrónico</label>
    <input
      id="email"
      v-model="form.email"
      type="email"
      autocomplete="email"
      required
      class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
    />

    <label for="password" class="mt-5 block">Contraseña</label>
    <div class="relative mt-2">
      <input
        id="password"
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        minlength="8"
        required
        class="w-full border border-black/20 bg-transparent py-3 pl-4 pr-12"
      />

      <button
        type="button"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="showPassword"
        class="absolute inset-y-0 right-2 flex items-center p-2"
        @click="showPassword = !showPassword"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="showPassword" d="m3 3 18 18" />
        </svg>
      </button>
    </div>

    <p class="mt-2 text-sm">Mínimo 8 caracteres.</p>

    <label for="confirmPassword" class="mt-5 block">
      Repetir contraseña
    </label>

    <div class="relative mt-2">
      <input
        id="confirmPassword"
        v-model="form.confirmPassword"
        :type="showConfirmPassword ? 'text' : 'password'"
        autocomplete="new-password"
        minlength="8"
        required
        class="w-full border border-black/20 bg-transparent py-3 pl-4 pr-12"
      />

      <button
        type="button"
        :aria-label="showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'"
        :aria-pressed="showConfirmPassword"
        class="absolute inset-y-0 right-2 flex items-center p-2"
        @click="showConfirmPassword = !showConfirmPassword"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="showConfirmPassword" d="m3 3 18 18" />
        </svg>
      </button>
    </div>

    <p
      v-if="errorMessage"
      role="alert"
      class="mt-4 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <button
      type="submit"
      :disabled="isSubmitting"
      class="mt-6 w-full border-2 border-black px-5 py-3 font-bold transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      {{ isSubmitting ? 'Creando cuenta…' : 'Crear cuenta' }}
    </button>
  </form>
</template>