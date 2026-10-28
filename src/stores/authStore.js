import { defineStore } from 'pinia'
import { useCartStore } from './cartStore'
import { getCurrentUser, logoutUser } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isSessionChecked: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
  },

  actions: {
    async fetchCurrentUser() {
      this.isSessionChecked = false

      try {
        this.user = await getCurrentUser()
        useCartStore().setOwner(this.user?.id)
      } catch (error) {
        this.user = null
        useCartStore().setOwner(null)

        if (![401, 403].includes(error.response?.status)) {
          throw error
        }
      } finally {
        this.isSessionChecked = true
      }
    },

    async logout() {
      await logoutUser()
      useCartStore().setOwner(null)
      this.user = null
      this.isSessionChecked = true
    },
  },
})