import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import RegisterForm from './RegisterForm.vue'
import { registerUser } from '../../services/authService'

vi.mock('../../services/authService', () => ({
  registerUser: vi.fn(),
}))

const mountForm = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })

  await router.push('/register')

  const wrapper = mount(RegisterForm, {
    global: {
      plugins: [router],
    },
  })

  return { wrapper, router }
}

const fillForm = async (wrapper) => {
  await wrapper.get('#name').setValue(' Andrea ')
  await wrapper.get('#email').setValue('andrea@example.com')
  await wrapper.get('#password').setValue('Password123')
  await wrapper.get('#confirmPassword').setValue('Password123')
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects passwords that do not match and stays on registration', async () => {
    const { wrapper, router } = await mountForm()

    await fillForm(wrapper)
    await wrapper.get('#confirmPassword').setValue('Different123')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Las contraseñas no coinciden.',
    )
    expect(registerUser).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/register')
  })

  it('creates an account, clears passwords and redirects to login', async () => {
    registerUser.mockResolvedValue({ id: 1 })

    const { wrapper, router } = await mountForm()

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(registerUser).toHaveBeenCalledExactlyOnceWith({
      name: 'Andrea',
      email: 'andrea@example.com',
      password: 'Password123',
    })
    expect(wrapper.get('#password').element.value).toBe('')
    expect(wrapper.get('#confirmPassword').element.value).toBe('')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows the duplicate email error and stays on registration', async () => {
    registerUser.mockRejectedValue({
      response: {
        data: {
          detail: 'El correo electrónico ya está registrado.',
        },
      },
    })

    const { wrapper, router } = await mountForm()

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'El correo electrónico ya está registrado.',
    )
    expect(router.currentRoute.value.path).toBe('/register')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })
})