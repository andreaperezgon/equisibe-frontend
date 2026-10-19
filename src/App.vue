<script setup>
import ShopAccessGate from './components/shop/ShopAccessGate.vue'
import { useRoute } from 'vue-router'
import PromotionalPopup from './components/promotions/PromotionalPopup.vue'
import { computed, onMounted, ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const route = useRoute()
const shopRestricted = computed(() =>
  route.path === '/shop' ||
  route.path.startsWith('/shop/') ||
  route.path === '/checkout',
)
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

  <ShopAccessGate v-if="shopRestricted">
    <RouterView />
    <PromotionalPopup v-if="route.path === '/shop'" />
  </ShopAccessGate>
  <RouterView v-else />

  <AppFooter />
  <PromotionalPopup v-if="route.path === '/'" />
</template>