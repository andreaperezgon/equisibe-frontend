import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from './LoginForm.vue'
import { getCurrentUser, loginUser } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../services/authService', () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

const mountForm = async () => {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: { template: '<div />' } },
      { path: '/account', component: { template: '<div />' } },
    ],
  })

  await router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginForm, {
    global: { plugins: [pinia, router] },
  })

  return { wrapper, router, pinia }
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads the user and redirects to account after login', async () => {
    const user = {
      id: 1,
      name: 'Andrea',
      email: 'andrea@example.com',
      role: 'CUSTOMER',
    }

    loginUser.mockResolvedValue(undefined)
    getCurrentUser.mockResolvedValue(user)

    const { wrapper, router, pinia } = await mountForm()

    await wrapper.get('#loginEmail').setValue('andrea@example.com')
    await wrapper.get('#loginPassword').setValue('ExamplePassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(loginUser).toHaveBeenCalledExactlyOnceWith({
      email: 'andrea@example.com',
      password: 'ExamplePassword123',
    })
    expect(useAuthStore(pinia).user).toEqual(user)
    expect(router.currentRoute.value.path).toBe('/account')
    expect(wrapper.get('#loginPassword').element.value).toBe('')
  })

  it('keeps the user on login when credentials are invalid', async () => {
    loginUser.mockRejectedValue({
      response: {
        data: {
          detail: 'Correo o contraseña incorrectos.',
        },
      },
    })

    const { wrapper, router } = await mountForm()

    await wrapper.get('#loginEmail').setValue('andrea@example.com')
    await wrapper.get('#loginPassword').setValue('WrongPassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Correo o contraseña incorrectos.',
    )
    expect(getCurrentUser).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })
})