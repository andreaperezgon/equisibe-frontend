<script setup>
import { reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})
</script>
<template>
  <form @submit.prevent>
<label for="name">Nombre</label>
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
<input
  id="password"
  v-model="form.password"
  type="password"
  autocomplete="new-password"
  minlength="8"
  required
  class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
/>
<label for="confirmPassword" class="mt-5 block">Repetir contraseña</label>
<input
  id="confirmPassword"
  v-model="form.confirmPassword"
  type="password"
  autocomplete="new-password"
  minlength="8"
  required
  class="mt-2 w-full border border-black/20 bg-transparent px-4 py-3"
/>
<button
  type="submit"
  class="mt-6 w-full border-2 border-black px-5 py-3 font-bold transition hover:bg-black hover:text-white"
>
  Crear cuenta
</button>
  </form>
</template>