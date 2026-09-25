<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const form = reactive({
  name: '',
  email: '',
  message: '',
})
const successMessage = ref('')
const errorMessage = ref('')
const handleSubmit = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await axios.post('http://localhost:8080/api/contacts', {
      name: form.name,
      email: form.email,
      message: form.message,
    })

    successMessage.value = 'Mensaje enviado correctamente.'

    form.name = ''
    form.email = ''
    form.message = ''
  } catch (error) {
    errorMessage.value = 'No se ha podido enviar el mensaje.'
    console.error(error)
  }
}
</script>
<template>
<form class="space-y-6" @submit.prevent="handleSubmit">    <div>
      <label
        for="name"
        class="block text-sm font-semibold"
      >
        Nombre
      </label>

      <input
        id="name"
        v-model="form.name"
        type="text"
        required
        class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3 outline-none transition focus:border-black"
      />
    </div>

    <div>
      <label
        for="email"
        class="block text-sm font-semibold"
      >
        Correo electrónico
      </label>

      <input
        id="email"
        v-model="form.email"
        type="email"
        required
        class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3 outline-none transition focus:border-black"
      />
    </div>

    <div>
      <label
        for="message"
        class="block text-sm font-semibold"
      >
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
      class="border-2 border-black px-7 py-3 font-bold transition hover:bg-black hover:text-white"
    >
      Enviar mensaje
    </button>
    <p
  v-if="successMessage"
  class="text-sm font-semibold text-green-700"
>
  {{ successMessage }}
</p>

<p
  v-if="errorMessage"
  class="text-sm font-semibold text-red-700"
>
  {{ errorMessage }}
</p>
  </form>
</template>