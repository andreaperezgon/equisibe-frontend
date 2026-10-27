import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AuthView from './AuthView.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

async function render(path = '/login') {
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: page },
      { path: '/login', name: 'login', component: page },
      { path: '/register', name: 'register', component: page },
      { path: '/forgot-password', component: page },
      { path: '/shop', component: page },
    ],
  })

  await router.push(path)
  await router.isReady()

  wrapper = mount(AuthView, {
    global: {
      plugins: [router],
      stubs: {
        LoginForm: {
          template: '<form data-testid="login-form" />',
        },
        RegisterForm: {
          template: '<form data-testid="register-form" />',
        },
        GoogleLoginButton: {
          template: '<div data-testid="google-button">Continuar con Google</div>',
        },
      },
    },
  })

  await flushPromises()
  return router
}

describe('AuthView', () => {
  it('muestra el formulario de inicio de sesión', async () => {
    await render()

    expect(wrapper.get('h1').text()).toBe('Qué bien verte de nuevo')
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(false)
    expect(wrapper.get('a[href="/forgot-password"]').text()).toContain(
      '¿Olvidaste tu contraseña?'
    )
    expect(wrapper.get('.auth-switch a[href="/login"]').attributes(
      'aria-current'
    )).toBe('page')
  })

  it('muestra el formulario de registro sin el enlace de recuperación', async () => {
    await render('/register')

    expect(wrapper.get('h1').text()).toBe('Tu espacio empieza aquí')
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/forgot-password"]').exists()).toBe(false)
    expect(wrapper.get('.auth-card').classes()).toContain('is-register')
    expect(wrapper.get('.auth-switch a[href="/register"]').attributes(
      'aria-current'
    )).toBe('page')
  })

  it('permite pasar del login al registro y volver', async () => {
    const router = await render()

    await wrapper.get('.auth-switch a[href="/register"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('register')
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Tu espacio empieza aquí')

    await wrapper.get('.auth-switch a[href="/login"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
    expect(wrapper.get('.auth-card').classes()).not.toContain('is-register')
  })

  it.each([
    ['/login', 'login-form'],
    ['/register', 'register-form'],
  ])('sitúa Google debajo del formulario en %s', async (path, form) => {
    await render(path)

    const formElement = wrapper.get(`[data-testid="${form}"]`).element
    const googleElement = wrapper.get('[data-testid="google-button"]').element

    expect(
      formElement.compareDocumentPosition(googleElement)
      & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('ofrece enlaces para volver a Inicio y a Tienda', async () => {
    await render()

    expect(wrapper.get('.auth-brand').attributes('href')).toBe('/')
    expect(wrapper.get('.auth-brand img').attributes('alt')).toBe('Equisibé')
    expect(wrapper.get('.auth-back').attributes('href')).toBe('/shop')
    expect(wrapper.get('h1').attributes('tabindex')).toBe('-1')
  })
})
