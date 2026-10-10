import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProductDetailView from './ProductDetailView.vue'
import { getProduct } from '../services/productService'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

vi.mock('../services/productService', () => ({
  getProduct: vi.fn(),
}))

const product = {
  id: 1,
  name: 'Camisa Equisibé',
  description: 'Camisa de la colección Equisibé.',
  price: 49.9,
  imageUrl: '/images/products/CAMISA.jpeg',
  category: 'Camisas',
  stockBySize: { S: 3, M: 0, L: 4, XL: 2 },
}

const mountDetail = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/shop', component: { template: '<div />' } },
      { path: '/shop/:id', component: ProductDetailView },
      { path: '/cart', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/register', component: { template: '<div />' } },
    ],
  })

  await router.push('/shop/1')
  await router.isReady()

  const pinia = createPinia()
  const auth = useAuthStore(pinia)

  auth.user = { id: 1, name: 'Cliente Equisibé' }
  auth.isSessionChecked = true

  const wrapper = mount(ProductDetailView, {
    global: {
      plugins: [router, pinia],
    },
  })

  return {
    wrapper,
    router,
    auth,
    cart: useCartStore(pinia),
  }
}

describe('ProductDetailView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
    getProduct.mockResolvedValue(product)
  })

  it('shows loading while fetching the product', async () => {
    let resolveRequest

    getProduct.mockImplementation(
      () => new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { wrapper } = await mountDetail()

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Cargando prenda…',
    )

    resolveRequest(product)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Cargando prenda…')
    expect(wrapper.get('h1').text()).toBe(product.name)
  })

  it('renders product information and the return link', async () => {
    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(getProduct).toHaveBeenCalledWith('1')
    expect(wrapper.get('h1').text()).toBe(product.name)
    expect(wrapper.text()).toContain(product.description)
    expect(wrapper.text()).toContain(product.category)
    expect(wrapper.text().replace(/\s/g, '')).toContain('49,90€')
    expect(wrapper.get('img').attributes('src')).toBe(product.imageUrl)
    expect(wrapper.get('img').attributes('alt')).toBe(product.name)
    expect(wrapper.get('a[href="/shop"]').exists()).toBe(true)
  })

  it('allows available sizes and disables sold-out sizes', async () => {
    const { wrapper } = await mountDetail()
    await flushPromises()

    const small = wrapper.get('button[aria-label="S: disponible"]')
    const medium = wrapper.get('button[aria-label="M: agotada"]')
    const large = wrapper.get('button[aria-label="L: disponible"]')

    expect(medium.element.disabled).toBe(true)
    expect(small.element.disabled).toBe(false)

    await small.trigger('click')

    expect(small.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Talla seleccionada: S.',
    )

    await large.trigger('click')

    expect(large.attributes('aria-pressed')).toBe('true')
    expect(small.attributes('aria-pressed')).toBe('false')
  })

  it('shows only TU for a one-size product', async () => {
    getProduct.mockResolvedValue({
      ...product,
      name: 'Gorra Equisibé',
      stockBySize: { TU: 5 },
    })

    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(wrapper.findAll('fieldset button')).toHaveLength(1)

    const size = wrapper.get(
      'button[aria-label="Talla única: disponible"]',
    )

    expect(size.text()).toBe('TU')

    await size.trigger('click')

    expect(wrapper.get('[role="status"]').text()).toContain(
      'Talla seleccionada: Única.',
    )
  })

  it('keeps TU visible and disables adding when sold out', async () => {
    getProduct.mockResolvedValue({
      ...product,
      stockBySize: { TU: 0 },
    })

    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(wrapper.findAll('fieldset button')).toHaveLength(1)

    expect(
      wrapper.get('button[aria-label="Talla única: agotada"]')
        .element.disabled,
    ).toBe(true)

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Esta prenda está agotada en todas las tallas.',
    )

    expect(
      wrapper.get('[data-testid="add-to-cart"]').element.disabled,
    ).toBe(true)
  })

  it('shows unavailable product message for a 404', async () => {
    getProduct.mockRejectedValue({
      response: { status: 404 },
    })

    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'La prenda no está disponible.',
    )

    expect(
      wrapper.find('[data-testid="add-to-cart"]').exists(),
    ).toBe(false)

    expect(wrapper.text()).not.toContain('Reintentar')
    expect(wrapper.get('a[href="/shop"]').exists()).toBe(true)
  })

  it('allows retrying after a network error', async () => {
    getProduct
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(product)

    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudo cargar la prenda. Inténtalo de nuevo.',
    )

    const retryButton = wrapper.findAll('button').find(
      (button) => button.text() === 'Reintentar',
    )

    expect(retryButton).toBeDefined()

    await retryButton.trigger('click')
    await flushPromises()

    expect(getProduct).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe(product.name)
  })

  it('shows a fallback if the image fails', async () => {
    const { wrapper } = await mountDetail()
    await flushPromises()

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Imagen no disponible')
  })

  it('loads the new product and clears the selected size on navigation', async () => {
    const { wrapper, router } = await mountDetail()
    await flushPromises()

    await wrapper.get('button[aria-label="S: disponible"]').trigger('click')

    getProduct.mockResolvedValueOnce({
      ...product,
      id: 2,
      name: 'Gorra Equisibé',
      stockBySize: { TU: 5 },
    })

    await router.push('/shop/2')
    await flushPromises()

    expect(getProduct).toHaveBeenLastCalledWith('2')
    expect(wrapper.get('h1').text()).toBe('Gorra Equisibé')
    expect(wrapper.findAll('fieldset button')).toHaveLength(1)

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Elige una talla disponible.',
    )

    expect(
      wrapper.get('fieldset button').attributes('aria-pressed'),
    ).toBe('false')
  })

  it('disables adding until an available size is selected', async () => {
    const { wrapper } = await mountDetail()
    await flushPromises()

    const button = wrapper.get('[data-testid="add-to-cart"]')

    expect(button.element.disabled).toBe(true)

    await wrapper.get('button[aria-label="S: disponible"]').trigger('click')

    expect(button.element.disabled).toBe(false)
  })

  it('adds the selected product and size for a logged-in customer', async () => {
    const { wrapper, cart } = await mountDetail()
    await flushPromises()

    await wrapper.get('button[aria-label="S: disponible"]').trigger('click')
    await wrapper.get('[data-testid="add-to-cart"]').trigger('click')
    await flushPromises()

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({
      productId: product.id,
      size: 'S',
      quantity: 1,
    })

    expect(wrapper.text()).toContain('Prenda añadida al carrito.')
  })

  it('shows an error when adding would exceed stock', async () => {
    const { wrapper, cart } = await mountDetail()
    await flushPromises()

    await wrapper.get('button[aria-label="XL: disponible"]').trigger('click')

    const button = wrapper.get('[data-testid="add-to-cart"]')

    await button.trigger('click')
    await flushPromises()

    await button.trigger('click')
    await flushPromises()

    await button.trigger('click')
    await flushPromises()

    expect(cart.items[0].quantity).toBe(2)
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No hay más unidades disponibles de esta talla.',
    )

    expect(wrapper.text()).not.toContain('Prenda añadida al carrito.')
  })

  it('opens the login dialog without adding items for a visitor', async () => {
    const { wrapper, cart, auth } = await mountDetail()
    await flushPromises()

    auth.user = null
    vi.spyOn(auth, 'fetchCurrentUser').mockResolvedValue(undefined)

    const dialog = wrapper.get('dialog').element
    dialog.showModal = vi.fn()

    await wrapper.get('button[aria-label="S: disponible"]').trigger('click')
    await wrapper.get('[data-testid="add-to-cart"]').trigger('click')
    await flushPromises()

    expect(auth.fetchCurrentUser).toHaveBeenCalledOnce()
    expect(dialog.showModal).toHaveBeenCalledOnce()
    expect(cart.items).toHaveLength(0)

    expect(wrapper.get('dialog a[href="/login"]').text()).toBe(
      'Iniciar sesión',
    )

    expect(wrapper.get('dialog a[href="/register"]').text()).toBe(
      'Registrarme',
    )
  })

  it('shows an error if the session cannot be checked', async () => {
    const { wrapper, cart, auth } = await mountDetail()
    await flushPromises()

    auth.user = null
    vi.spyOn(auth, 'fetchCurrentUser').mockRejectedValue(
      new Error('Network Error'),
    )

    await wrapper.get('button[aria-label="S: disponible"]').trigger('click')
    await wrapper.get('[data-testid="add-to-cart"]').trigger('click')
    await flushPromises()

    expect(cart.items).toHaveLength(0)
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudo comprobar tu sesión. Inténtalo de nuevo.',
    )
  })
})