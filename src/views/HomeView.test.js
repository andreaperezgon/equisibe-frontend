import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './HomeView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/contact', component: { template: '<div />' } },
    { path: '/tailoring', component: { template: '<div />' } },
    { path: '/shop', component: { template: '<div />' } },
  ],
})

describe('HomeView', () => {
  it('renders the main hero content', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain(
      'Ropa hecha desde cero, a la medida de quien la lleva'
    )
    expect(wrapper.text()).toContain('Taller de confección')
  })

  it('renders the tailoring services', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Confección desde cero')
    expect(wrapper.text()).toContain('Trajes y vestidos de ceremonia')
  })

  it('renders the workshop information and gallery section', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Del rollo de tela a la prenda terminada')
    expect(wrapper.text()).toContain('Hecho a mano, pieza a pieza')
  })

  it('contains links to contact, tailoring and shop', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('a[href="/contact"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/tailoring"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/shop"]').exists()).toBe(true)
  })
})