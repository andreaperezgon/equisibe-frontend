<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const message = computed(() => {
  if (route.query.google === 'link-required') {
    return 'Este correo ya tiene una cuenta. Entra con tu contraseña; tendrás que vincular Google desde tu perfil.'
  }
  if (route.query.google === 'failed') {
    return 'No se pudo completar el acceso con Google. Puedes volver a intentarlo.'
  }
  return ''
})
</script>

<template>
  <div class="google-access">
    <p v-if="message" role="alert" class="google-message">
      {{ message }}
    </p>

    <p class="google-divider">o</p>

    <a
      class="google-button"
      href="http://localhost:8080/oauth2/authorization/google"
    >
      Continuar con Google
    </a>

    <p class="google-notice">
      Usaremos tu nombre y correo para gestionar tu cuenta.
      Consulta la
      <RouterLink to="/privacy" target="_blank" rel="noopener">
        política de privacidad
      </RouterLink>.
    </p>

    
  </div>
</template>

<style scoped>
.google-access {
  margin: 24px 0;
}
.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 18px;
  border: 1px solid #aab9bf;
  border-radius: 12px;
  background: #f8f7f4;
  color: #34434a;
  font: inherit;
  font-size: 16px;
  text-decoration: none;
  transition: background-color 180ms;
}
.google-button:hover {
  background: #e2eaed;
}
.google-button:focus-visible {
  outline: 2px solid #526d79;
  outline-offset: 4px;
}
.google-notice {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
}
.google-notice a {
  color: inherit;
  text-decoration: underline;
}
.google-divider {
  margin: 0 0 16px;
  text-align: center;
  font-size: 14px;
}
.google-message {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #9b3030;
}
</style>
