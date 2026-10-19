<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import AccountOrders from '../components/account/AccountOrders.vue'
import AccountFavorites from '../components/account/AccountFavorites.vue'

const authStore = useAuthStore()
const router = useRouter()
const isLoggingOut = ref(false)
const errorMessage = ref('')

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
  <main class="mx-auto w-full max-w-5xl px-5 py-12 md:px-8">
    <h1 class="text-3xl font-semibold">
      {{ authStore.user?.role === 'ADMIN' ? 'Panel de administración' : 'Mi cuenta' }}
    </h1>

    <template v-if="authStore.user">
      <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p>Hola, {{ authStore.user.name }}</p>

        <button
          type="button"
          :disabled="isLoggingOut"
          class="border border-black px-4 py-2 text-sm transition hover:bg-black hover:text-white disabled:opacity-40"
          @click="handleLogout"
        >
          {{ isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}
        </button>
      </div>

      <p
        v-if="errorMessage"
        role="alert"
        class="mt-4 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <nav
        v-if="authStore.user.role === 'ADMIN'"
        aria-label="Opciones de administración"
        class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <RouterLink
          to="/admin/products"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Administrar productos</span>
          <span class="mt-2 block text-sm text-black/70">
            Gestiona las prendas de la tienda.
          </span>
        </RouterLink>
      
        <RouterLink
          to="/admin/orders"
          class="block border border-black/20 p-4 hover:border-black"
        >
          <span class="block">Pedidos</span>
          <span class="mt-1 block text-sm">
            Gestiona la preparación, el envío y la entrega.
          </span>
        </RouterLink>
      
        <RouterLink to="/admin/popups" class="block border border-black/20 p-5">
          <span class="block font-bold">Popups</span>
          <span class="mt-2 block text-sm">Gestiona los anuncios y códigos de descuento.</span>
        </RouterLink>
      </nav>

      <nav
        v-if="authStore.user.role !== 'ADMIN'"
        aria-label="Opciones de mi cuenta"
        class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <a
          href="#profile"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Mi perfil</span>
          <span class="mt-2 block text-sm text-black/70">
            Consulta los datos de tu cuenta.
          </span>
        </a>

        <RouterLink
          to="/account/addresses"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Mis direcciones</span>
          <span class="mt-2 block text-sm text-black/70">
            Añade o modifica tus direcciones de envío.
          </span>
        </RouterLink>

        <RouterLink
          to="/cart"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Mi cesta</span>
          <span class="mt-2 block text-sm text-black/70">
            Revisa las prendas antes de comprar.
          </span>
        </RouterLink>

        <a
          href="#orders"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Mis pedidos</span>
          <span class="mt-2 block text-sm text-black/70">
            Consulta tus compras y su estado.
          </span>
        </a>

        <a
          href="#favorites"
          class="block border border-black/20 p-5 transition hover:bg-black/5"
        >
          <span class="block font-bold">Mis favoritos</span>
          <span class="mt-2 block text-sm text-black/70">
            Encuentra las prendas que has guardado.
          </span>
        </a>

      </nav>

      <section
        v-if="authStore.user.role !== 'ADMIN'"
        id="profile"
        aria-labelledby="profile-heading"
        class="mt-12 scroll-mt-6 border-t border-black/20 pt-8"
      >
        <h2 id="profile-heading" class="text-2xl font-semibold">
          Mi perfil
        </h2>

        <dl class="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-black/70">Nombre</dt>
            <dd class="mt-1 break-words">{{ authStore.user.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-black/70">Correo electrónico</dt>
            <dd class="mt-1 break-words">{{ authStore.user.email }}</dd>
          </div>
        </dl>
      </section>

      <AccountOrders v-if="authStore.user.role !== 'ADMIN'" :key="authStore.user.id" />
      <AccountFavorites v-if="authStore.user.role !== 'ADMIN'" :key="authStore.user.id" />
    </template>
  </main>
</template>
