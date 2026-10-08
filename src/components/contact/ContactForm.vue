<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

const form = reactive({
  name: '',
  email: '',
  message: '',
})

const successMessage = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  successMessage.value = ''
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await axios.get(`${API_URL}/auth/csrf`, {
      withCredentials: true,
    })

    const { headerName, token } = response.data

    await axios.post(
      `${API_URL}/contacts`,
      {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      },
      {
        withCredentials: true,
        headers: {
          [headerName]: token,
        },
      },
    )

    successMessage.value = 'Mensaje enviado correctamente.'

    form.name = ''
    form.email = ''
    form.message = ''
  } catch {
    errorMessage.value = 'No se ha podido enviar el mensaje.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <div>
      <label for="name" class="block text-sm font-semibold">
        Nombre
      </label>

      <input
        id="name"
        v-model="form.name"
        type="text"
        autocomplete="name"
        required
        class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3 outline-none transition focus:border-black"
      />
    </div>

    <div>
      <label for="email" class="block text-sm font-semibold">
        Correo electrónico
      </label>

      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        required
        class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3 outline-none transition focus:border-black"
      />
    </div>

    <div>
      <label for="message" class="block text-sm font-semibold">
        Mensaje
      </label>

      <textarea
        id="message"
        v-model="form.message"
        rows="6"
        required
        class="mt-2 w-full resize-none border border-black/20 bg-transparent px-4 py-3 outline-none transition focus:border-black"
      ></textarea>
    </div>

    <button
      type="submit"
      :disabled="isSubmitting"
      class="border-2 border-black px-7 py-3 font-bold transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      {{ isSubmitting ? 'Enviando…' : 'Enviar mensaje' }}
    </button>

    <p
      v-if="successMessage"
      role="status"
      class="text-sm font-semibold text-green-700"
    >
      {{ successMessage }}
    </p>

    <p
      v-if="errorMessage"
      role="alert"
      class="text-sm font-semibold text-red-700"
    >
      {{ errorMessage }}
    </p>
  </form>
</template>