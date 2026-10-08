import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppHeader from './AppHeader.vue'
import { useAuthStore } from '../../stores/authStore'

const mountHeader = async (user = null) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      '/', '/about', '/tailoring', '/shop',
      '/contact', '/login', '/cart', '/account',
    ].map((path) => ({
      path,
      component: { template: '<div />' },
    })),
  })

  const pinia = createPinia()
  useAuthStore(pinia).user = user

  await router.push('/')
  await router.isReady()

  return mount(AppHeader, {
    global: {
      plugins: [pinia, router],
    },
  })
}

describe('AppHeader', () => {
  it('renders the Equisibé logo', async () => {
    const wrapper = await mountHeader()
    const logo = wrapper.get('img')

    expect(logo.attributes('alt')).toBe('Equisibé')
  })

  it('renders navigation and login links for guests', async () => {
    const wrapper = await mountHeader()

    expect(wrapper.text()).toContain('Inicio')
    expect(wrapper.text()).toContain('Quiénes somos')
    expect(wrapper.text()).toContain('A medida')
    expect(wrapper.text()).toContain('Tienda')
    expect(wrapper.text()).toContain('Contáctanos')
    expect(wrapper.get('a[href="/login"]').text()).toBe(
      'Iniciar sesión / Regístrate',
    )
    expect(wrapper.find('a[href="/account"]').exists()).toBe(false)
  })

  it('opens the mobile menu', async () => {
    const wrapper = await mountHeader()

    await wrapper.get('button[aria-label="Abrir menú"]').trigger('click')

    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    expect(
      wrapper.get('button[aria-label="Cerrar menú"]').attributes('aria-expanded'),
    ).toBe('true')
  })

  it('closes the mobile menu', async () => {
    const wrapper = await mountHeader()

    await wrapper.get('button[aria-label="Abrir menú"]').trigger('click')
    await wrapper.get('button[aria-label="Cerrar menú"]').trigger('click')

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
    expect(
      wrapper.get('button[aria-label="Abrir menú"]').attributes('aria-expanded'),
    ).toBe('false')
  })

  it('shows account links on desktop and mobile for authenticated users', async () => {
    const wrapper = await mountHeader({
      id: 1,
      name: 'Andrea',
      email: 'andrea@example.com',
      role: 'CUSTOMER',
    })

    expect(wrapper.get('a[href="/account"]').text()).toBe('Mi cuenta')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="Abrir menú"]').trigger('click')

    const mobileLink = wrapper.get('#mobile-menu a[href="/account"]')
    expect(mobileLink.text()).toBe('Mi cuenta')

    await mobileLink.trigger('click')

    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })
})