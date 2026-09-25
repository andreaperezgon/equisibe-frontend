import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import TailoringView from './TailoringView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/contact', component: { template: '<div />' } },
  ],
})

describe('TailoringView', () => {
  it('renders the tailoring process', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(TailoringView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Primera toma de contacto')
    expect(wrapper.text()).toContain('Medidas y elección de tejido')
    expect(wrapper.text()).toContain('Pruebas y ajustes')
    expect(wrapper.text()).toContain('Entrega de la prenda')
  })

  it('renders services and indicative prices', async () => {
    const wrapper = mount(TailoringView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Traje de novio')
    expect(wrapper.text()).toContain('Desde 1.200 €')
    expect(wrapper.text()).toContain('Camisa a medida')
    expect(wrapper.text()).toContain('Desde 95 €')
  })

  it('contains a link to the contact page', async () => {
    const wrapper = mount(TailoringView, {
      global: {
        plugins: [router],
      },
    })

    const contactLink = wrapper.find('a[href="/contact"]')

    expect(contactLink.exists()).toBe(true)
  })
})