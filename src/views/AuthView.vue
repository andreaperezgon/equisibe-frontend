<script setup>
import { computed, nextTick, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
import GoogleLoginButton from '../components/auth/GoogleLoginButton.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'
import logo from '../assets/header.png'

const route = useRoute()
const heading = ref(null)
const isRegister = computed(() => route.name === 'register')

const focusHeading = async () => {
  await nextTick()
  heading.value?.focus({ preventScroll: true })
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-card" :class="{ 'is-register': isRegister }">
      <aside class="auth-visual">
        <svg
          class="auth-threads"
          viewBox="0 0 440 850"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <g fill="none" stroke="#94aab3" stroke-width="1.2">
            <path d="M-90 60C100-30 420 80 320 255S30 375 115 530 500 615 500 810"/>
            <path d="M-80 72C110-18 432 92 332 267S42 387 127 542 512 627 512 822"/>
            <path d="M-70 84C120-6 444 104 344 279S54 399 139 554 524 639 524 834"/>
            <path d="M-60 96C130 6 456 116 356 291S66 411 151 566 536 651 536 846"/>
          </g>
          <g fill="none" stroke="#c2cbd0" stroke-width="1">
            <path d="M-100 740C90 780 410 600 280 420S60 300 180 110 400-20 500 50"/>
            <path d="M-100 752C102 792 422 612 292 432S72 312 192 122 412-8 512 62"/>
            <path d="M-100 764C114 804 434 624 304 444S84 324 204 134 424 4 524 74"/>
          </g>
          <path
            d="M-60 420C90 280 360 350 300 485S110 590 190 700"
            fill="none"
            stroke="#758f9b"
            stroke-width="1.4"
          />
        </svg>

        <div class="auth-caption">
          <p class="auth-eyebrow">Equisibé · Oviedo</p>
          <p class="auth-caption-title">Historias que se entrelazan.</p>
          <p>Tu espacio para guardar lo que te gusta.</p>
        </div>
      </aside>

      <div class="auth-content">
        <RouterLink to="/" class="auth-brand" aria-label="Equisibé, ir a inicio">
          <img :src="logo" alt="Equisibé" width="150">
        </RouterLink>

        <nav class="auth-switch" aria-label="Acceso a tu cuenta">
          <RouterLink
            to="/login"
            :aria-current="!isRegister ? 'page' : undefined"
            :class="{ selected: !isRegister }"
          >Iniciar sesión</RouterLink>
          <RouterLink
            to="/register"
            :aria-current="isRegister ? 'page' : undefined"
            :class="{ selected: isRegister }"
          >Crear cuenta</RouterLink>
        </nav>

        <Transition name="auth-copy" mode="out-in" @after-enter="focusHeading">
          <section :key="isRegister ? 'register' : 'login'" class="auth-form-panel">
            <h1 ref="heading" tabindex="-1">
              {{ isRegister ? 'Tu espacio empieza aquí' : 'Qué bien verte de nuevo' }}
            </h1>
            <p class="auth-description">
              {{ isRegister
                ? 'Crea tu cuenta y guarda tus prendas, pedidos y favoritos.'
                : 'Entra para volver a tus favoritos y seguir tus pedidos.' }}
            </p>

            

            <RegisterForm v-if="isRegister" />
            <LoginForm v-else />

            <GoogleLoginButton />

            <RouterLink
              v-if="!isRegister"
              to="/forgot-password"
              class="auth-recovery"
            >¿Olvidaste tu contraseña?</RouterLink>

            <div class="auth-alternative">
              <p>{{ isRegister ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?' }}</p>
              <RouterLink :to="isRegister ? '/login' : '/register'">
                {{ isRegister ? 'Iniciar sesión' : 'Crear mi cuenta' }}
                <span aria-hidden="true"> →</span>
              </RouterLink>
            </div>
          </section>
        </Transition>
      </div>
    </div>

    <RouterLink to="/shop" class="auth-back">
      <span aria-hidden="true">← </span> Seguir descubriendo Equisibé
    </RouterLink>
  </main>
</template>

<style scoped>
.auth-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 24px 40px;
}
.auth-card {
  position: relative;
  min-height: 820px;
  overflow: hidden;
  border: 1px solid #d8dddf;
  border-radius: 8px;
  background: #f8f7f4;
}
.auth-visual {
  position: absolute;
  inset: 0 auto 0 0;
  width: 44%;
  overflow: hidden;
  background: #e2eaed;
  border-right: 1px solid #d8dddf;
  transition: transform 650ms cubic-bezier(.22,.68,.15,1);
}
.is-register .auth-visual {
  transform: translateX(127.272727%);
  border-right: 0;
  border-left: 1px solid #d8dddf;
}
.auth-threads {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.auth-caption {
  position: absolute;
  right: 32px;
  bottom: 40px;
  left: 32px;
  padding: 24px;
  background: #f8f7f4;
  border: 1px solid #d3dde0;
  border-radius: 4px;
  color: #34434a;
}
.auth-eyebrow {
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
}
.auth-caption-title {
  margin: 14px 0 10px;
  font-size: clamp(20px, 2.1vw, 28px);
  line-height: 1.5;
}
.auth-caption > p:last-child {
  font-size: 12px;
  line-height: 1.8;
}
.auth-content {
  position: relative;
  width: 56%;
  margin-left: 44%;
  padding: 40px clamp(24px, 4vw, 58px);
  transition: margin-left 650ms cubic-bezier(.22,.68,.15,1);
}
.is-register .auth-content { margin-left: 0; }
.auth-brand {
  display: block;
  width: 135px;
  margin: 0 auto 32px;
}
.auth-brand img { width: 100%; height: auto; }
.auth-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 32px;
  border: 1px solid #d8dddf;
  border-radius: 5px;
}
.auth-switch a {
  padding: 12px 6px;
  border-radius: 3px;
  text-align: center;
  font-size: 12px;
  color: #4c606a;
}
.auth-switch a.selected { background: #e2eaed; color: #28383f; }
h1 {
  font-size: clamp(21px, 2.2vw, 27px);
  font-weight: 500;
  line-height: 1.5;
}
.auth-description {
  margin: 12px 0 28px;
  color: #53616a;
  font-size: 12px;
  line-height: 1.9;
}
.auth-form-panel :deep(label) { color: #37434a; font-size: 12px; }
.auth-form-panel :deep(input) {
  background: #fcfcfa;
  border: 1px solid #cbd3d6;
  border-radius: 4px;
  color: #28383f;
  font-size: 13px;
}
.auth-form-panel :deep(input:focus-visible) {
  outline: 2px solid #738b96;
  outline-offset: 2px;
}
.auth-form-panel :deep(button[type="submit"]) {
  border: 1px solid #c3d2d8;
  border-radius: 4px;
  background: #e2eaed;
  color: #28383f;
  font-size: 12px;
  font-weight: 500;
}
.auth-form-panel :deep(button[type="submit"]:hover:not(:disabled)) {
  background: #d3e0e5;
  color: #28383f;
}
.auth-form-panel :deep(#register-privacy-notice) {
  font-size: 11px;
  line-height: 1.8;
}
.auth-recovery {
  display: block;
  margin-top: 22px;
  text-align: center;
  font-size: 11px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.auth-alternative {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid #d8dddf;
  text-align: center;
  font-size: 11px;
  line-height: 1.8;
}
.auth-alternative p { margin-bottom: 9px; color: #53616a; }
.auth-alternative a {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.auth-back {
  display: block;
  width: fit-content;
  margin: 24px auto 0;
  color: #4c606a;
  font-size: 11px;
  line-height: 1.8;
}
a:focus-visible, button:focus-visible {
  outline: 2px solid #738b96;
  outline-offset: 4px;
}
.auth-copy-enter-active, .auth-copy-leave-active {
  transition: opacity 150ms, transform 150ms;
}
.auth-copy-enter-from { opacity: 0; transform: translateY(6px); }
.auth-copy-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 767px) {
  .auth-page { padding: 24px 16px; }
  .auth-card { min-height: 0; }
  .auth-visual, .is-register .auth-visual {
    position: relative;
    width: 100%;
    height: 180px;
    transform: none;
    border: 0;
    border-bottom: 1px solid #d8dddf;
  }
  .auth-caption {
    inset: 22px 22px auto;
    padding: 16px;
  }
  .auth-caption-title { margin: 8px 0; font-size: 19px; }
  .auth-caption > p:last-child { font-size: 11px; }
  .auth-content, .is-register .auth-content {
    width: 100%;
    margin-left: 0;
    padding: 28px 22px;
    transition: none;
  }
  .auth-brand { width: 115px; margin-bottom: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .auth-visual, .auth-content,
  .auth-copy-enter-active, .auth-copy-leave-active {
    transition: none;
  }
}

/* auth-readable-type:start */
.auth-eyebrow {
  font-size: 12px;
}
.auth-caption > p:last-child {
  font-size: 15px;
}
.auth-switch a {
  font-size: 14px;
}
.auth-form-panel h1 {
  font-size: clamp(25px, 2.5vw, 31px);
}
.auth-description {
  font-size: 15px;
  line-height: 1.8;
}
.auth-form-panel :deep(label) {
  font-size: 15px;
}
.auth-form-panel :deep(input) {
  font-size: 16px;
}
.auth-form-panel :deep(button[type="submit"]) {
  font-size: 15px;
}
.auth-form-panel :deep(#register-privacy-notice) {
  font-size: 13px;
  line-height: 1.8;
}
.auth-form-panel :deep(form > p.text-sm) {
  font-size: 14px;
}
.auth-recovery,
.auth-alternative,
.auth-back {
  font-size: 14px;
}
@media (max-width: 767px) {
  .auth-visual,
  .is-register .auth-visual {
    height: 220px;
  }
  .auth-caption {
    inset: 18px;
    padding: 16px;
  }
  .auth-caption-title {
    font-size: 21px;
  }
  .auth-caption > p:last-child {
    font-size: 14px;
  }
}
/* auth-readable-type:end */

</style>
