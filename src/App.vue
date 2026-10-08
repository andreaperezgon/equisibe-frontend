<script setup>
import { onMounted, ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const sessionError = ref('')

onMounted(async () => {
  try {
    await authStore.fetchCurrentUser()
  } catch {
    sessionError.value = 'No se pudo comprobar la sesión. Recarga la página.'
  }
})
</script>

<template>
  <AppHeader />

  <p v-if="sessionError" role="alert" class="px-5 py-3 text-center text-red-700">
    {{ sessionError }}
  </p>

  <RouterView />

  <AppFooter />
</template>