import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppHeader from './AppHeader.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/about', component: { template: '<div />' } },
    { path: '/tailoring', component: { template: '<div />' } },
    { path: '/shop', component: { template: '<div />' } },
    { path: '/contact', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/cart', component: { template: '<div />' } },
  ],
})

const mountHeader = async () => {
  router.push('/')
  await router.isReady()

  return mount(AppHeader, {
    global: {
      plugins: [router],
    },
  })
}

describe('AppHeader', () => {
  it('renders the Equisibé logo', async () => {
    const wrapper = await mountHeader()

    const logo = wrapper.find('img')

    expect(logo.exists()).toBe(true)
    expect(logo.attributes('alt')).toBe('Equisibé')
  })

  it('renders the main navigation links', async () => {
    const wrapper = await mountHeader()

    expect(wrapper.text()).toContain('Inicio')
    expect(wrapper.text()).toContain('Quiénes somos')
    expect(wrapper.text()).toContain('Sastrería a medida')
    expect(wrapper.text()).toContain('Tienda')
    expect(wrapper.text()).toContain('Contáctanos')
    expect(wrapper.text()).toContain('Iniciar sesión / Regístrate')
  })

  it('opens the mobile menu when clicking the hamburger button', async () => {
    const wrapper = await mountHeader()

    const menuButton = wrapper.find('button[aria-label="Abrir menú"]')

    expect(menuButton.exists()).toBe(true)

    await menuButton.trigger('click')

    expect(
      wrapper.find('button[aria-label="Cerrar menú"]').exists()
    ).toBe(true)
  })

  it('closes the mobile menu when clicking the hamburger button again', async () => {
    const wrapper = await mountHeader()

    await wrapper
      .find('button[aria-label="Abrir menú"]')
      .trigger('click')

    await wrapper
      .find('button[aria-label="Cerrar menú"]')
      .trigger('click')

    expect(
      wrapper.find('button[aria-label="Abrir menú"]').exists()
    ).toBe(true)
  })
})