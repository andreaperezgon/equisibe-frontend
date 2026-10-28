import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import GoogleLoginButton from './GoogleLoginButton.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

async function render(query = {}) {
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: page },
      { path: '/privacy', component: page },
    ],
  })

  await router.push({ path: '/login', query })
  await router.isReady()

  wrapper = mount(GoogleLoginButton, {
    global: { plugins: [router] },
  })

  return router
}

describe('GoogleLoginButton', () => {
  it('dirige al inicio del acceso con Google, no al callback', async () => {
    await render()

    const button = wrapper.get('.google-button')
    expect(button.text()).toBe('Continuar con Google')
    expect(button.attributes('href')).toBe(
      'http://localhost:8080/oauth2/authorization/google'
    )
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('muestra el separador antes del botón', async () => {
    await render()

    const separator = wrapper.get('.google-divider')
    expect(separator.text()).toBe('o')
    expect(separator.element.nextElementSibling).toBe(
      wrapper.get('.google-button').element
    )
  })

  it('informa del uso de datos y enlaza la política', async () => {
    await render()

    expect(wrapper.text()).toContain('Usaremos tu nombre y correo')
    const link = wrapper.get('a[href="/privacy"]')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
  })

  it('explica que una cuenta existente necesita vinculación', async () => {
    await render({ google: 'link-required' })

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Entra con tu contraseña'
    )
    expect(wrapper.get('.google-button').exists()).toBe(true)
  })

  it('permite reintentar después de un fallo', async () => {
    await render({ google: 'failed' })

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Puedes volver a intentarlo'
    )
    expect(wrapper.get('.google-button').exists()).toBe(true)
  })

  it('no muestra errores por un parámetro desconocido', async () => {
    await render({ google: 'otro' })

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('retira el aviso cuando cambia la ruta', async () => {
    const router = await render({ google: 'failed' })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await router.push('/login')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
