import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from './LoginForm.vue'
import { getCurrentUser, loginUser } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../services/authService', () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('logs in, loads the user and clears the password', async () => {
    const user = {
      id: 1,
      name: 'Andrea',
      email: 'andrea@example.com',
      role: 'CUSTOMER',
    }

    loginUser.mockResolvedValue(undefined)
    getCurrentUser.mockResolvedValue(user)

    const pinia = createPinia()
    const wrapper = mount(LoginForm, {
      global: { plugins: [pinia] },
    })

    await wrapper.get('#loginEmail').setValue('andrea@example.com')
    await wrapper.get('#loginPassword').setValue('ExamplePassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(loginUser).toHaveBeenCalledExactlyOnceWith({
      email: 'andrea@example.com',
      password: 'ExamplePassword123',
    })
    expect(getCurrentUser).toHaveBeenCalledOnce()
    expect(useAuthStore(pinia).user).toEqual(user)
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Has iniciado sesión correctamente.',
    )
    expect(wrapper.get('#loginPassword').element.value).toBe('')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })

  it('shows an error for invalid credentials', async () => {
    loginUser.mockRejectedValue({
      response: {
        data: {
          detail: 'Correo o contraseña incorrectos.',
        },
      },
    })

    const wrapper = mount(LoginForm, {
      global: { plugins: [createPinia()] },
    })

    await wrapper.get('#loginEmail').setValue('andrea@example.com')
    await wrapper.get('#loginPassword').setValue('WrongPassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Correo o contraseña incorrectos.',
    )
    expect(getCurrentUser).not.toHaveBeenCalled()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })
})