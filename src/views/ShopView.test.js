import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShopView from './ShopView.vue'
import { getProducts } from '../services/productService'

vi.mock('../services/productService', () => ({
  getProducts: vi.fn(),
}))

const mountShop = () =>
  mount(ShopView, {
    global: {
      stubs: {
        ProductCard: {
          props: ['product'],
          template: '<article>{{ product.name }}</article>',
        },
      },
    },
  })

describe('ShopView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows loading while fetching products', async () => {
    let resolveRequest

    getProducts.mockImplementation(
      () => new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const wrapper = mountShop()

    expect(wrapper.get('[role="status"]').text()).toBe('Cargando prendas…')

    resolveRequest([])
    await flushPromises()

    expect(wrapper.text()).not.toContain('Cargando prendas…')
  })

  it('renders products returned by the API', async () => {
    getProducts.mockResolvedValue([
      { id: 1, name: 'Camisa blanca' },
      { id: 2, name: 'Pantalón negro' },
    ])

    const wrapper = mountShop()
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(wrapper.text()).toContain('Camisa blanca')
    expect(wrapper.text()).toContain('Pantalón negro')
    expect(getProducts).toHaveBeenCalledTimes(1)
  })

  it('shows an empty catalog message', async () => {
    getProducts.mockResolvedValue([])

    const wrapper = mountShop()
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Todavía no hay prendas disponibles.',
    )
    expect(wrapper.findAll('article')).toHaveLength(0)
  })

  it('shows an error when loading fails', async () => {
    getProducts.mockRejectedValue(new Error('Network Error'))

    const wrapper = mountShop()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudo cargar la tienda. Inténtalo de nuevo.',
    )
    expect(wrapper.get('button').text()).toBe('Reintentar')
  })

  it('loads products after retrying a failed request', async () => {
    getProducts
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([{ id: 1, name: 'Camisa blanca' }])

    const wrapper = mountShop()
    await flushPromises()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getProducts).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Camisa blanca')
  })
})