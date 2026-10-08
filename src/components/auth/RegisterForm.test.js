import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterForm from './RegisterForm.vue'
import { registerUser } from '../../services/authService'

vi.mock('../../services/authService', () => ({
  registerUser: vi.fn(),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects passwords that do not match', async () => {
    const wrapper = mount(RegisterForm)

    await wrapper.get('#name').setValue('Andrea')
    await wrapper.get('#email').setValue('andrea@example.com')
    await wrapper.get('#password').setValue('Password123')
    await wrapper.get('#confirmPassword').setValue('Different123')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Las contraseñas no coinciden.',
    )
    expect(registerUser).not.toHaveBeenCalled()
  })
  it('creates an account and clears the passwords', async () => {
  registerUser.mockResolvedValue({ id: 1 })

  const wrapper = mount(RegisterForm)

  await wrapper.get('#name').setValue(' Andrea ')
  await wrapper.get('#email').setValue('andrea@example.com')
  await wrapper.get('#password').setValue('Password123')
  await wrapper.get('#confirmPassword').setValue('Password123')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(registerUser).toHaveBeenCalledExactlyOnceWith({
    name: 'Andrea',
    email: 'andrea@example.com',
    password: 'Password123',
  })
  expect(wrapper.get('[role="status"]').text()).toBe(
    'Tu cuenta se ha creado correctamente.',
  )
  expect(wrapper.get('#password').element.value).toBe('')
  expect(wrapper.get('#confirmPassword').element.value).toBe('')
})
it('shows the error when the email is already registered', async () => {
  registerUser.mockRejectedValue({
    response: {
      data: {
        detail: 'El correo electrónico ya está registrado.',
      },
    },
  })

  const wrapper = mount(RegisterForm)

  await wrapper.get('#name').setValue('Andrea')
  await wrapper.get('#email').setValue('andrea@example.com')
  await wrapper.get('#password').setValue('Password123')
  await wrapper.get('#confirmPassword').setValue('Password123')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.get('[role="alert"]').text()).toBe(
    'El correo electrónico ya está registrado.',
  )
  expect(wrapper.find('[role="status"]').exists()).toBe(false)
  expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
})
})