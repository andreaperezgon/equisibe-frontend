import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../services/favoriteService'

export const useFavoriteStore = defineStore('favorites', () => {
  const auth = useAuthStore()
  const items = ref([])
  const loading = ref(false)
  const busyIds = ref([])
  const loaded = ref(false)

  let generation = 0
  let pendingLoad = null

  const userEmail = computed(() => auth.user?.email ?? null)

  watch(userEmail, () => {
    generation += 1
    items.value = []
    busyIds.value = []
    loading.value = false
    loaded.value = false
    pendingLoad = null
  }, { flush: 'sync' })

  const isFavorite = (productId) =>
    items.value.some((item) => item.id === productId)

  const isBusy = (productId) =>
    busyIds.value.includes(productId)

  const load = (force = false) => {
    if (!userEmail.value) return Promise.resolve([])
    if (pendingLoad) return pendingLoad
    if (loaded.value && !force) return Promise.resolve(items.value)

    const currentGeneration = generation
    loading.value = true

    pendingLoad = (async () => {
      try {
        const data = await getFavorites()

        if (currentGeneration !== generation) return []

        items.value = data
        loaded.value = true
        return data
      } finally {
        if (currentGeneration === generation) {
          loading.value = false
          pendingLoad = null
        }
      }
    })()

    return pendingLoad
  }

  const toggle = async (product) => {
    if (!userEmail.value) {
      throw new Error('Inicia sesión para guardar favoritos.')
    }

    if (isBusy(product.id)) return

    const currentGeneration = generation
    busyIds.value.push(product.id)

    try {
      await load()
      if (currentGeneration !== generation) return

      if (isFavorite(product.id)) {
        await removeFavorite(product.id)

        if (currentGeneration === generation) {
          items.value = items.value.filter(
            (item) => item.id !== product.id,
          )
        }
      } else {
        await addFavorite(product.id)

        if (currentGeneration === generation) {
          items.value.unshift(product)
        }
      }
    } finally {
      if (currentGeneration === generation) {
        busyIds.value = busyIds.value.filter(
          (id) => id !== product.id,
        )
      }
    }
  }

  return {
    items,
    loading,
    loaded,
    isFavorite,
    isBusy,
    load,
    toggle,
  }
})
