import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from './AboutView.vue'

describe('AboutView', () => {
  it('renders the about page introduction', () => {
    const wrapper = mount(AboutView)

    expect(wrapper.text()).toContain('Quiénes somos')
    expect(wrapper.text()).toContain('Las personas detrás de Equisibé')
    expect(wrapper.text()).toContain(
      'Equisibé nace de la pasión por la confección'
    )
  })

  it('renders all team members', () => {
    const wrapper = mount(AboutView)

    expect(wrapper.text()).toContain('Pablo Álvarez')
    expect(wrapper.text()).toContain('Xeila González')
  })

  it('renders each team member role', () => {
    const wrapper = mount(AboutView)

    expect(wrapper.text()).toContain('Sastrería y confección')
    expect(wrapper.text()).toContain('Diseño y patronaje')
  })

  it('renders two team member components', () => {
    const wrapper = mount(AboutView)

    const teamMembers = wrapper.findAll('article')

    expect(teamMembers).toHaveLength(2)
  })
})