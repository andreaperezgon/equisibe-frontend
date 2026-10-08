import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from './LoginForm.vue'
import { loginUser } from '../../services/authService'

vi.mock('../../services/authService', () => ({
  loginUser: vi.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('logs in and clears the password', async () => {
    loginUser.mockResolvedValue(undefined)

    const wrapper = mount(LoginForm)

    await wrapper.get('#loginEmail').setValue('andrea@example.com')
    await wrapper.get('#loginPassword').setValue('ExamplePassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(loginUser).toHaveBeenCalledExactlyOnceWith({
      email: 'andrea@example.com',
      password: 'ExamplePassword123',
    })
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

  const wrapper = mount(LoginForm)

  await wrapper.get('#loginEmail').setValue('andrea@example.com')
  await wrapper.get('#loginPassword').setValue('WrongPassword123')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.get('[role="alert"]').text()).toBe(
    'Correo o contraseña incorrectos.',
  )
  expect(wrapper.find('[role="status"]').exists()).toBe(false)
  expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
})
})