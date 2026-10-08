import { defineStore } from 'pinia'
import { getCurrentUser } from '../services/authService'

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

        if (error.response?.status !== 401 &&
            error.response?.status !== 403) {
          throw error
        }
      } finally {
        this.isSessionChecked = true
      }
    },
  },
})