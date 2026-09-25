import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactView from './ContactView.vue'
import ContactForm from '../components/contact/ContactForm.vue'

describe('ContactView', () => {
  it('renders the contact page information', () => {
    const wrapper = mount(ContactView)

    expect(wrapper.text()).toContain('Contáctanos')
    expect(wrapper.text()).toContain('Hablemos de tu prenda')
    expect(wrapper.text()).toContain(
      'Atendemos con cita previa'
    )
  })

  it('renders the contact form', () => {
    const wrapper = mount(ContactView)

    expect(wrapper.findComponent(ContactForm).exists()).toBe(true)
  })
})