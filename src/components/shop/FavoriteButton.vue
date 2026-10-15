<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useFavoriteStore } from '../../stores/favoriteStore'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const auth = useAuthStore()
const favorites = useFavoriteStore()
const error = ref('')
const needsLogin = ref(false)
const checkingSession = ref(false)

const selected = computed(() =>
  favorites.isFavorite(props.product.id),
)

const busy = computed(() =>
  checkingSession.value ||
  favorites.loading ||
  favorites.isBusy(props.product.id),
)

let active = true
let latestLoad = 0

watch(
  [() => props.product.id, () => auth.user?.email],
  () => {
    const requestId = ++latestLoad
    error.value = ''
    needsLogin.value = false

    if (!auth.isAuthenticated) return

    favorites.load().catch(() => {
      if (active && requestId === latestLoad) {
        error.value = 'No se pudieron cargar tus favoritos. Vuelve a intentarlo.'
      }
    })
  },
  { immediate: true },
)

const toggleFavorite = async () => {
  if (busy.value) return

  error.value = ''
  needsLogin.value = false
  checkingSession.value = true

  try {
    if (!auth.isAuthenticated) {
      await auth.fetchCurrentUser()
    }

    if (!active) return

    if (!auth.isAuthenticated) {
      needsLogin.value = true
      return
    }

    await favorites.toggle(props.product)
  } catch (failure) {
    if (!active) return

    if ([401, 403].includes(failure.response?.status)) {
      needsLogin.value = true
    } else {
      error.value = failure.response?.status === 404
        ? 'La prenda ya no está disponible.'
        : 'No se pudo actualizar tu favorito. Inténtalo de nuevo.'
    }
  } finally {
    if (active) checkingSession.value = false
  }
}

onBeforeUnmount(() => {
  active = false
})
</script>

<template>
  <div>
    <button
      type="button"
      :disabled="busy"
      :aria-pressed="selected"
      :aria-busy="busy"
      class="w-full border border-black px-4 py-3 text-sm transition hover:bg-black/5 disabled:cursor-wait disabled:opacity-40"
      @click="toggleFavorite"
    >
      <span aria-hidden="true">{{ selected ? '♥' : '♡' }}</span>
      {{
        busy
          ? 'Actualizando…'
          : selected
            ? 'Quitar de favoritos'
            : 'Guardar en favoritos'
      }}
    </button>

    <p v-if="needsLogin" role="status" class="mt-2 text-sm">
      <RouterLink to="/login" class="underline underline-offset-4">
        Inicia sesión para guardar favoritos.
      </RouterLink>
    </p>

    <p v-if="error" role="alert" class="mt-2 text-sm text-red-700">
      {{ error }}
    </p>
  </div>
</template>
