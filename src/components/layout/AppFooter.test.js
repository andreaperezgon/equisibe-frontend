import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppFooter from './AppFooter.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/about', component: { template: '<div />' } },
    { path: '/tailoring', component: { template: '<div />' } },
    { path: '/contact', component: { template: '<div />' } },
  ],
})

describe('AppFooter', () => {
  it('renders the footer navigation links', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Inicio')
    expect(wrapper.text()).toContain('Nosotros')
    expect(wrapper.text()).toContain('Sastrería')
    expect(wrapper.text()).toContain('Contacto')
  })

  it('renders the Equisibé logo', async () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router],
      },
    })

    const logo = wrapper.find('img')

    expect(logo.exists()).toBe(true)
    expect(logo.attributes('alt')).toBe('Equisibé')
  })

  it('contains the Instagram link', async () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router],
      },
    })

    const instagramLink = wrapper.find(
      'a[href="https://www.instagram.com/equisibe/"]'
    )

    expect(instagramLink.exists()).toBe(true)
    expect(instagramLink.attributes('target')).toBe('_blank')
  })
})