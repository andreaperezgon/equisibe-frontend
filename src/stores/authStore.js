import { defineStore } from 'pinia'
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
      } catch (error) {
        this.user = null

        if (![401, 403].includes(error.response?.status)) {
          throw error
        }
      } finally {
        this.isSessionChecked = true
      }
    },

    async logout() {
      await logoutUser()
      this.user = null
      this.isSessionChecked = true
    },
  },
})