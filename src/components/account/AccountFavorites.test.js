import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AccountFavorites from './AccountFavorites.vue'
import { useAuthStore } from '../../stores/authStore'
import { getFavorites } from '../../services/favoriteService'

vi.mock('../../services/favoriteService', () => ({
  getFavorites: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

let wrapper
let pinia

beforeEach(() => {
  vi.resetAllMocks()
  pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().user = { email: 'cliente@example.com', role: 'CUSTOMER' }
  getFavorites.mockResolvedValue([])
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(AccountFavorites, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: RouterLinkStub,
        ProductCard: {
          name: 'ProductCard',
          props: ['product'],
          template: '<article>{{ product.name }}</article>',
        },
      },
    },
  })
}

describe('AccountFavorites', () => {
  it('muestra la carga y bloquea actualizar mientras espera', async () => {
    let finish
    getFavorites.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()

    expect(wrapper.get('[role="status"]').text()).toContain('Cargando')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()

    finish([])
    await flushPromises()

    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })

  it('muestra la lista vacía y un acceso a Tienda', async () => {
    render()
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has guardado prendas')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/shop')
  })

  it('muestra una tarjeta por cada prenda guardada', async () => {
    getFavorites.mockResolvedValue([
      { id: 7, name: 'Camisa' },
      { id: 8, name: 'Gorra' },
    ])
    render()
    await flushPromises()

    expect(wrapper.findAll('article').map(item => item.text())).toEqual([
      'Camisa', 'Gorra',
    ])
    expect(wrapper.text()).not.toContain('Todavía no has guardado')
  })

  it('actualiza la lista aunque ya se haya cargado antes', async () => {
    getFavorites.mockResolvedValueOnce([{ id: 7, name: 'Camisa' }])
    render()
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(1)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getFavorites).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('article')).toHaveLength(0)
    expect(wrapper.text()).toContain('Todavía no has guardado prendas')
  })

  it.each([401, 403])('pide volver a entrar ante un error %s', async (status) => {
    getFavorites.mockRejectedValue({ response: { status } })
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Inicia sesión de nuevo'
    )
    expect(wrapper.findAll('article')).toHaveLength(0)
  })

  it('permite reintentar tras un fallo de conexión', async () => {
    getFavorites.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar tus favoritos'
    )

    getFavorites.mockResolvedValueOnce([{ id: 7, name: 'Camisa' }])
    const retry = wrapper.findAll('button').find(
      button => button.text() === 'Reintentar'
    )
    await retry.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('article').text()).toBe('Camisa')
  })
})
