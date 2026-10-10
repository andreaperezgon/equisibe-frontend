import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShopView from './ShopView.vue'
import { getProducts } from '../services/productService'

vi.mock('../services/productService', () => ({
  getProducts: vi.fn(),
}))

const products = [
  { id: 1, name: 'Camisa blanca', category: 'Camisas' },
  { id: 2, name: 'Gorra Equisibé', category: 'Gorras' },
  { id: 3, name: 'Camisa azul', category: 'Camisas' },
]

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
    getProducts.mockResolvedValue(products)
  })

  it('shows loading while fetching products', async () => {
    let resolveRequest

    getProducts.mockImplementation(
      () => new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const wrapper = mountShop()

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Cargando prendas…',
    )

    resolveRequest([])
    await flushPromises()

    expect(wrapper.text()).not.toContain('Cargando prendas…')
  })

  it('renders products returned by the API', async () => {
    const wrapper = mountShop()
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(3)
    expect(wrapper.text()).toContain('Camisa blanca')
    expect(wrapper.text()).toContain('Gorra Equisibé')
    expect(wrapper.text()).toContain('Camisa azul')
    expect(getProducts).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="status"]').text()).toBe('3 prendas')
  })

  it('shows an empty catalog message', async () => {
    getProducts.mockResolvedValue([])

    const wrapper = mountShop()
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Todavía no hay prendas disponibles.',
    )
    expect(wrapper.findAll('article')).toHaveLength(0)
    expect(wrapper.find('select').exists()).toBe(false)
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
      .mockResolvedValueOnce(products)

    const wrapper = mountShop()
    await flushPromises()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getProducts).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('article')).toHaveLength(3)
  })

  it('shows each available category only once', async () => {
    const wrapper = mountShop()
    await flushPromises()

    expect(
      wrapper.findAll('option').map((option) => option.text()),
    ).toEqual([
      'Todas las categorías',
      'Camisas',
      'Gorras',
    ])
  })

  it('shows only products from the selected category', async () => {
    const wrapper = mountShop()
    await flushPromises()

    await wrapper.get('select').setValue('Camisas')

    expect(
      wrapper.findAll('article').map((article) => article.text()),
    ).toEqual(['Camisa blanca', 'Camisa azul'])

    expect(wrapper.get('[role="status"]').text()).toBe('2 prendas')
  })

  it('updates results when switching categories', async () => {
    const wrapper = mountShop()
    await flushPromises()

    await wrapper.get('select').setValue('Camisas')
    await wrapper.get('select').setValue('Gorras')

    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('article').text()).toBe('Gorra Equisibé')
    expect(wrapper.get('[role="status"]').text()).toBe('1 prenda')
  })

  it('restores all products when clearing the filter', async () => {
    const wrapper = mountShop()
    await flushPromises()

    await wrapper.get('select').setValue('Gorras')
    await wrapper.get('select').setValue('')

    expect(wrapper.findAll('article')).toHaveLength(3)
    expect(wrapper.get('[role="status"]').text()).toBe('3 prendas')
  })
})