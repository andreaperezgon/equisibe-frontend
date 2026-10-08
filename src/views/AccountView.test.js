import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountView from './AccountView.vue'
import { useAuthStore } from '../stores/authStore'
import { logoutUser } from '../services/authService'

vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

const mountAccount = async () => {
  const pinia = createPinia()
  const store = useAuthStore(pinia)

  store.user = {
    id: 1,
    name: 'Andrea',
    email: 'andrea@example.com',
    role: 'CUSTOMER',
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/account', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })

  await router.push('/account')
  await router.isReady()

  const wrapper = mount(AccountView, {
    global: { plugins: [pinia, router] },
  })

  return { wrapper, store, router }
}

describe('AccountView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows the authenticated user name and email', async () => {
    const { wrapper } = await mountAccount()

    expect(wrapper.get('h1').text()).toBe('Mi cuenta')
    expect(wrapper.text()).toContain('Hola, Andrea')
    expect(wrapper.text()).toContain('andrea@example.com')
  })

  it('clears the user and redirects after logout', async () => {
    logoutUser.mockResolvedValue(undefined)

    const { wrapper, store, router } = await mountAccount()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(logoutUser).toHaveBeenCalledOnce()
    expect(store.user).toBeNull()
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('keeps the user when logout fails', async () => {
    logoutUser.mockRejectedValue(new Error('Network error'))

    const { wrapper, store, router } = await mountAccount()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(store.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.path).toBe('/account')
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudo cerrar la sesión. Inténtalo de nuevo.',
    )
    expect(wrapper.get('button').element.disabled).toBe(false)
  })
})