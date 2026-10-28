import { afterEach, describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import PrivacyView from './PrivacyView.vue'
import ReturnsPolicyView from './ReturnsPolicyView.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

describe('páginas informativas', () => {
  it.each([
    [PrivacyView, 'Política de privacidad'],
    [ReturnsPolicyView, 'Política de devoluciones'],
  ])('ofrece identificación y contacto en %s', (component, heading) => {
    wrapper = mount(component, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h1').text()).toBe(heading)
    expect(wrapper.text()).toContain('Pablo Álvarez')
    expect(wrapper.get('a[href="mailto:equisibe@gmail.com"]').text()).toBe(
      'equisibe@gmail.com'
    )
  })

  it('mantiene visible el aviso de privacidad pendiente de completar', () => {
    wrapper = mount(PrivacyView)

    expect(wrapper.get('aside').text()).toContain(
      'Borrador pendiente de completar'
    )
  })

  it('permite acceder a los pedidos desde la política de devoluciones', () => {
    wrapper = mount(ReturnsPolicyView, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const link = wrapper.getComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/account')
    expect(link.text()).toContain('Ir a mis pedidos')
  })
})
