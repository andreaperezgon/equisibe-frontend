import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import CartView from './CartView.vue'
import { useCartStore } from '../stores/cartStore'
import { validateCart } from '../services/cartService'

vi.mock('../services/cartService', () => ({
  validateCart: vi.fn(),
}))

const product = {
  id: 1,
  name: 'Camisa Equisibé',
  imageUrl: '/images/products/CAMISA.jpeg',
  price: 49.9,
  stockBySize: { S: 3, M: 0, L: 4, XL: 2 },
}

const validResponse = (price = 49.9) => ({
  valid: true,
  items: [
    {
      productId: 1,
      name: 'Camisa Equisibé',
      size: 'S',
      quantity: 1,
      unitPrice: price,
      lineTotal: price,
    },
  ],
  issues: [],
  subtotal: price,
  currency: 'EUR',
})

const wrappers = []

const mountCart = async () => {
  const pinia = createPinia()
  const cart = useCartStore(pinia)

  cart.addItem(product, 'S')

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cart', component: CartView },
      { path: '/shop', component: { template: '<div />' } },
      { path: '/shop/:id', component: { template: '<div />' } },
    ],
  })

  await router.push('/cart')
  await router.isReady()

  const wrapper = mount(CartView, {
    global: {
      plugins: [router, pinia],
    },
  })

  wrappers.push(wrapper)

  return { wrapper, cart }
}

const checkCart = async (wrapper) => {
  await wrapper.get('[data-testid="validate-cart"]').trigger('click')
  await flushPromises()
}

describe('CartView backend validation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    validateCart.mockResolvedValue(validResponse())
  })

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers.length = 0
  })

  it('sends product, size and quantity and shows success', async () => {
    const { wrapper } = await mountCart()

    await checkCart(wrapper)

    expect(validateCart).toHaveBeenCalledExactlyOnceWith([
      {
        productId: 1,
        size: 'S',
        quantity: 1,
      },
    ])

    expect(
      wrapper.get('[data-testid="cart-validation-success"]').text(),
    ).toBe(
      'Hay existencias para todas las prendas de tu cesta y los precios están actualizados.',
    )
  })

  it('updates prices and subtotal using the backend response', async () => {
    validateCart.mockResolvedValue(validResponse(59.9))

    const { wrapper, cart } = await mountCart()

    await checkCart(wrapper)

    expect(cart.items[0].price).toBe(59.9)
    expect(cart.subtotal).toBe(59.9)

    expect(wrapper.get('aside').text().replace(/\s/g, '')).toContain(
      '59,90€',
    )

    expect(
      wrapper.get('[data-testid="cart-validation-success"]').text(),
    ).toContain('Algunos precios han cambiado')
  })

  it.each([
    [
      'INSUFFICIENT_STOCK',
      0,
      'está agotada. Elimínala del carrito.',
    ],
    [
      'INSUFFICIENT_STOCK',
      1,
      'solo queda 1 unidad. Reduce la cantidad.',
    ],
    [
      'INSUFFICIENT_STOCK',
      2,
      'quedan 2 unidades. Reduce la cantidad.',
    ],
    [
      'PRODUCT_UNAVAILABLE',
      null,
      'ya no está disponible. Elimínala del carrito.',
    ],
    [
      'INVALID_SIZE',
      null,
      'esta talla no está disponible para la prenda.',
    ],
  ])(
    'explains %s with available stock %s',
    async (code, availableStock, expectedMessage) => {
      validateCart.mockResolvedValue({
        valid: false,
        items: [],
        issues: [
          {
            productId: 1,
            size: 'S',
            code,
            availableStock,
          },
        ],
        subtotal: null,
        currency: 'EUR',
      })

      const { wrapper, cart } = await mountCart()

      cart.setQuantity(1, 'S', 3)
      await nextTick()
      await checkCart(wrapper)

      expect(wrapper.get('[role="alert"]').text()).toContain(
        expectedMessage,
      )

      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Camisa Equisibé, talla S',
      )

      expect(
        wrapper.find('[data-testid="cart-validation-success"]').exists(),
      ).toBe(false)

      expect(cart.items[0].quantity).toBe(3)
    },
  )

  it.each([401, 403])(
    'explains an authorization error with status %s',
    async (status) => {
      validateCart.mockRejectedValue({
        response: { status },
      })

      const { wrapper } = await mountCart()

      await checkCart(wrapper)

      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Inicia sesión de nuevo',
      )

      expect(
        wrapper.get('[data-testid="validate-cart"]').element.disabled,
      ).toBe(false)
    },
  )

  it('allows retrying after a connection error', async () => {
    validateCart
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(validResponse())

    const { wrapper } = await mountCart()

    await checkCart(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo comprobar la cesta',
    )

    await checkCart(wrapper)

    expect(validateCart).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    expect(
      wrapper.find('[data-testid="cart-validation-success"]').exists(),
    ).toBe(true)
  })

  it('clears the previous success when quantity changes', async () => {
    const { wrapper } = await mountCart()

    await checkCart(wrapper)

    expect(
      wrapper.find('[data-testid="cart-validation-success"]').exists(),
    ).toBe(true)

    await wrapper.get(
      'button[aria-label="Aumentar cantidad de Camisa Equisibé, talla S"]',
    ).trigger('click')

    expect(
      wrapper.find('[data-testid="cart-validation-success"]').exists(),
    ).toBe(false)
  })

  it('disables controls while validation is pending', async () => {
    let resolveRequest

    validateCart.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    const { wrapper } = await mountCart()

    const button = wrapper.get('[data-testid="validate-cart"]')

    await button.trigger('click')

    expect(button.text()).toBe('Comprobando…')
    expect(button.element.disabled).toBe(true)

    expect(
      wrapper.get(
        'button[aria-label="Aumentar cantidad de Camisa Equisibé, talla S"]',
      ).element.disabled,
    ).toBe(true)

    expect(
      wrapper.get(
        'button[aria-label="Eliminar Camisa Equisibé, talla S"]',
      ).element.disabled,
    ).toBe(true)

    await button.trigger('click')

    expect(validateCart).toHaveBeenCalledTimes(1)

    resolveRequest(validResponse())
    await flushPromises()

    expect(button.element.disabled).toBe(false)
  })

  it('ignores a response if the cart changed during the request', async () => {
    let resolveRequest

    validateCart.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    const { wrapper, cart } = await mountCart()

    await wrapper.get('[data-testid="validate-cart"]').trigger('click')

    cart.setQuantity(1, 'S', 2)
    await nextTick()

    resolveRequest(validResponse(59.9))
    await flushPromises()

    expect(cart.items[0].quantity).toBe(2)
    expect(cart.items[0].price).toBe(49.9)

    expect(
      wrapper.find('[data-testid="cart-validation-success"]').exists(),
    ).toBe(false)
  })
})