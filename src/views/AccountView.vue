<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import AccountOrders from '../components/account/AccountOrders.vue'
import AccountFavorites from '../components/account/AccountFavorites.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isLoggingOut = ref(false)
const errorMessage = ref('')
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')
const initial = computed(() =>
  authStore.user?.name?.trim().slice(0, 1).toUpperCase() || 'E',
)
const selectedSection = computed(() => route.hash || '#orders')

const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  errorMessage.value = ''

  try {
    await authStore.logout()
    await router.replace('/login')
  } catch {
    errorMessage.value = 'No se pudo cerrar la sesión. Inténtalo de nuevo.'
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <main class="account-page">
    <header class="account-heading">
      <div>
        <p class="account-eyebrow">Equisibé · Tu espacio</p>
        <h1>{{ isAdmin ? 'Panel de administración' : 'Mi cuenta' }}</h1>
      </div>
      <RouterLink to="/shop" class="account-shop-link">
        {{ isAdmin ? 'Ver la tienda' : 'Seguir descubriendo' }}
        <span aria-hidden="true"> →</span>
      </RouterLink>
    </header>

    <template v-if="authStore.user">
      <div class="account-layout">
        <aside class="account-sidebar">
          <div class="account-welcome">
            <span class="account-avatar" aria-hidden="true">{{ initial }}</span>
            <div>
              <p class="account-greeting">Hola, {{ authStore.user.name }}</p>
              <p class="account-welcome-note">
                {{ isAdmin ? 'Todo tu taller, a mano.' : 'Qué bien tenerte por aquí.' }}
              </p>
            </div>
          </div>

          <nav
            v-if="!isAdmin"
            class="account-navigation"
            aria-label="Opciones de mi cuenta"
          >
            <RouterLink
              :to="{ path: '/account', hash: '#orders' }"
              :class="{ selected: selectedSection === '#orders' }"
              :aria-current="selectedSection === '#orders' ? 'location' : undefined"
            >Mis pedidos <span aria-hidden="true">↗</span></RouterLink>

            <RouterLink
              :to="{ path: '/account', hash: '#profile' }"
              :class="{ selected: selectedSection === '#profile' }"
              :aria-current="selectedSection === '#profile' ? 'location' : undefined"
            >Mi perfil <span aria-hidden="true">↗</span></RouterLink>

            <RouterLink to="/account/addresses">
              Mis direcciones <span aria-hidden="true">↗</span>
            </RouterLink>

            <RouterLink
              :to="{ path: '/account', hash: '#favorites' }"
              :class="{ selected: selectedSection === '#favorites' }"
              :aria-current="selectedSection === '#favorites' ? 'location' : undefined"
            >Mis favoritos <span aria-hidden="true">↗</span></RouterLink>

            <RouterLink to="/cart">
              Mi cesta <span aria-hidden="true">↗</span>
            </RouterLink>
          </nav>

          <nav
            v-else
            class="account-navigation"
            aria-label="Opciones de administración"
          >
            <RouterLink to="/admin/orders">
              Pedidos <span aria-hidden="true">↗</span>
            </RouterLink>
            <RouterLink to="/admin/products">
              Administrar productos <span aria-hidden="true">↗</span>
            </RouterLink>
            <RouterLink to="/admin/popups">
              Popups <span aria-hidden="true">↗</span>
            </RouterLink>
          </nav>

          <div class="account-signout">
            <button
              type="button"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              {{ isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </aside>

        <div class="account-content">
          <p v-if="errorMessage" role="alert" class="account-error">
            {{ errorMessage }}
          </p>

          <template v-if="!isAdmin">
            <AccountOrders :key="`orders-${authStore.user.id}`" />
            <AccountFavorites :key="`favorites-${authStore.user.id}`" />

            <section
              id="profile"
              class="account-profile"
              aria-labelledby="profile-heading"
            >
              <p class="account-eyebrow">Los datos de tu cuenta</p>
              <h2 id="profile-heading">Mi perfil</h2>

              <dl>
                <div>
                  <dt>Nombre</dt>
                  <dd>{{ authStore.user.name }}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>{{ authStore.user.email }}</dd>
                </div>
              </dl>

              <RouterLink to="/forgot-password" class="account-text-link">
                Recuperar o cambiar mi contraseña →
              </RouterLink>
            </section>
          </template>

          <section v-else class="account-admin-intro">
            <p class="account-eyebrow">Administración</p>
            <h2>Tu taller, organizado.</h2>
            <p class="account-intro">
              Gestiona las prendas, prepara los pedidos y mantén al día
              lo que se ve en la tienda.
            </p>

            <div class="account-admin-links">
              <RouterLink to="/admin/orders">
                <span class="account-number" aria-hidden="true">01</span>
                <h3>Pedidos</h3>
                <p>Preparación, envío y entrega, en un mismo lugar.</p>
                <span class="account-text-link">Gestionar pedidos →</span>
              </RouterLink>
              <RouterLink to="/admin/products">
                <span class="account-number" aria-hidden="true">02</span>
                <h3>Productos</h3>
                <p>Prendas, imágenes, tallas, stock y rebajas.</p>
                <span class="account-text-link">Administrar productos →</span>
              </RouterLink>
              <RouterLink to="/admin/popups">
                <span class="account-number" aria-hidden="true">03</span>
                <h3>Popups y tienda</h3>
                <p>Anuncios, descuentos y apertura de la tienda.</p>
                <span class="account-text-link">Gestionar contenido →</span>
              </RouterLink>
            </div>
          </section>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.account-page {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 28px 64px;
}
.account-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}
.account-eyebrow {
  font-size: 12px;
  letter-spacing: .1em;
  line-height: 1.8;
  text-transform: uppercase;
  color: #53616a;
}
h1 {
  margin-top: 8px;
  font-size: clamp(27px, 3vw, 34px);
  line-height: 1.4;
  font-weight: 500;
}
.account-shop-link, .account-text-link {
  font-size: 14px;
  line-height: 1.8;
  color: #425963;
  text-decoration: underline;
  text-underline-offset: 5px;
}
.account-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 26px;
  align-items: start;
}
.account-sidebar {
  position: sticky;
  top: 24px;
  padding: 26px 18px 18px;
  border: 1px solid #d8dddf;
  border-radius: 7px;
  background: #f8f7f4;
}
.account-welcome {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 0 5px 27px;
}
.account-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2eaed;
  color: #374b55;
  font-size: 20px;
}
.account-greeting {
  font-size: 15px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.account-welcome-note {
  margin-top: 4px;
  color: #53616a;
  font-size: 12px;
  line-height: 1.7;
}
.account-navigation {
  display: grid;
  gap: 7px;
}
.account-navigation a, .account-signout button {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 4px;
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
  transition: background-color 160ms;
}
.account-navigation a:hover,
.account-navigation a.selected {
  background: #e2eaed;
}
.account-navigation span {
  color: #667e88;
}
.account-signout {
  margin-top: 25px;
  padding-top: 16px;
  border-top: 1px solid #d8dddf;
}
.account-signout button:hover { background: #eceeeb; }
.account-signout button:disabled { opacity: .5; }
.account-content {
  display: grid;
  min-width: 0;
  gap: 26px;
}
.account-profile, .account-admin-intro,
.account-content :deep(#orders),
.account-content :deep(#favorites) {
  min-width: 0;
  margin-top: 0;
  padding: 30px;
  border: 1px solid #d8dddf;
  border-radius: 7px;
  background: #f8f7f4;
  scroll-margin-top: 24px;
}
.account-content :deep(h2), h2 {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.5;
}
.account-content :deep([data-testid="account-order"]) {
  border-color: #d4dcdf;
  border-radius: 5px;
  background: #fcfcfa;
}
.account-content :deep([data-testid="account-order"] h3) {
  font-size: 16px;
  font-weight: 500;
}
.account-content :deep(#orders .font-bold) {
  font-weight: 500;
}
.account-content :deep(#orders a),
.account-content :deep(#orders button),
.account-content :deep(#favorites > div > button) {
  color: #425963;
}
.account-profile h2 { margin-top: 7px; }
.account-profile dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin: 25px 0;
}
.account-profile dt {
  margin-bottom: 9px;
  color: #53616a;
  font-size: 13px;
}
.account-profile dd {
  font-size: 15px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.account-error {
  padding: 16px;
  border: 1px solid #dfbdbd;
  border-radius: 5px;
  color: #9b3030;
  background: #fff8f6;
}
.account-admin-intro h2 { margin-top: 12px; }
.account-intro {
  max-width: 560px;
  margin: 18px 0 30px;
  font-size: 15px;
  line-height: 1.9;
  color: #53616a;
}
.account-admin-links {
  display: grid;
  gap: 16px;
}
.account-admin-links > a {
  padding: 24px;
  border: 1px solid #d4dcdf;
  border-radius: 5px;
  background: #fcfcfa;
}
.account-admin-links > a:hover { background: #edf1f1; }
.account-number {
  color: #667e88;
  font-size: 13px;
}
.account-admin-links h3 {
  margin: 12px 0;
  font-size: 20px;
}
.account-admin-links p {
  margin-bottom: 18px;
  font-size: 14px;
  line-height: 1.8;
  color: #53616a;
}
a:focus-visible, button:focus-visible {
  outline: 2px solid #738b96;
  outline-offset: 4px;
}
@media (max-width: 850px) {
  .account-layout { grid-template-columns: 1fr; }
  .account-sidebar { position: static; }
  .account-navigation {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .account-welcome { padding-bottom: 20px; }
  .account-signout { margin-top: 16px; }
}
@media (max-width: 540px) {
  .account-page { padding: 28px 16px 40px; }
  .account-profile, .account-admin-intro,
  .account-content :deep(#orders),
  .account-content :deep(#favorites) {
    padding: 22px 18px;
  }
  .account-profile dl { grid-template-columns: 1fr; }
  .account-content :deep(h2), h2 { font-size: 22px; }
  .account-navigation a { padding: 12px 9px; }
}
@media (prefers-reduced-motion: reduce) {
  .account-navigation a { transition: none; }
}
</style>
