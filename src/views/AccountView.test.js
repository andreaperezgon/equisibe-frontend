import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import AccountView from './AccountView.vue'
import { useAuthStore } from '../stores/authStore'

describe('AccountView', () => {
  it('shows the authenticated user name and email', () => {
    const pinia = createPinia()

    useAuthStore(pinia).user = {
      id: 1,
      name: 'Andrea',
      email: 'andrea@example.com',
      role: 'CUSTOMER',
    }

    const wrapper = mount(AccountView, {
      global: { plugins: [pinia] },
    })

    expect(wrapper.get('h1').text()).toBe('Mi cuenta')
    expect(wrapper.text()).toContain('Hola, Andrea')
    expect(wrapper.text()).toContain('andrea@example.com')
  })
})