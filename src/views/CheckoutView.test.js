import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CheckoutView from './CheckoutView.vue'
import { useCartStore } from '../stores/cartStore'
import { getShippingAddresses } from '../services/shippingAddressService'
import { validateCheckout } from '../services/checkoutService'

vi.mock('../services/shippingAddressService', () => ({
  getShippingAddresses: vi.fn(),
}))

vi.mock('../services/checkoutService', () => ({
  validateCheckout: vi.fn(),
}))

const address = {
  id: 1,
  recipientName: 'Cliente de prueba',
  phone: '600123456',
  addressLine1: 'Calle Mayor 10',
  addressLine2: '',
  city: 'Oviedo',
  province: 'Asturias',
  postalCode: '33001',
  countryCode: 'ES',
}

const validResponse = () => ({
  shippingAddress: address,
  cart: {
    valid: true,
    items: [{
      productId: 1,
      name: 'Sudadera',
      size: 'L',
      quantity: 1,
      unitPrice: 54.9,
      lineTotal: 54.9,
    }],
    issues: [],
    subtotal: 54.9,
    shippingCost: 3.95,
    total: 58.85,
    currency: 'EUR',
  },
})

const wrappers = []

const mountCheckout = async (withProduct = true) => {
  const pinia = createPinia()
  const cart = useCartStore(pinia)

  if (withProduct) {
    cart.addItem({
      id: 1,
      name: 'Sudadera',
      price: 54.9,
      imageUrl: '',
      stockBySize: { L: 3 },
    }, 'L')
  }

  const wrapper = mount(CheckoutView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })

  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, cart }
}

const selectAndValidate = async (wrapper) => {
  await wrapper.get('input[type="radio"]').setValue(true)
  await wrapper.get('[data-testid="validate-checkout"]').trigger('click')
  await flushPromises()
}

describe('CheckoutView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getShippingAddresses.mockResolvedValue([address])
    validateCheckout.mockResolvedValue(validResponse())
  })

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers.length = 0
  })

  it('shows an empty cart without the validation button', async () => {
    const { wrapper } = await mountCheckout(false)

    expect(wrapper.text()).toContain('Tu carrito está vacío.')
    expect(
      wrapper.find('[data-testid="validate-checkout"]').exists(),
    ).toBe(false)
  })

  it('requires selecting an address before validation', async () => {
    const { wrapper } = await mountCheckout()
    const button = wrapper.get('[data-testid="validate-checkout"]')

    expect(button.element.disabled).toBe(true)

    await wrapper.get('input[type="radio"]').setValue(true)

    expect(button.element.disabled).toBe(false)
  })

  it('validates the selected address and displays backend totals', async () => {
    const { wrapper } = await mountCheckout()

    await selectAndValidate(wrapper)

    expect(validateCheckout).toHaveBeenCalledExactlyOnceWith(1, [
      { productId: 1, size: 'L', quantity: 1 },
    ])

    expect(wrapper.get('[data-testid="shipping-cost"]').text()
      .replace(/\s/g, '')).toBe('3,95€')

    expect(wrapper.get('[data-testid="cart-total"]').text()
      .replace(/\s/g, '')).toBe('58,85€')

    expect(wrapper.get('[role="status"]').text()).toContain(
      'Dirección y disponibilidad comprobadas.',
    )
  })

  it('shows free shipping when confirmed by the backend', async () => {
    const response = validResponse()
    response.cart.items[0].unitPrice = 80
    response.cart.items[0].lineTotal = 80
    response.cart.subtotal = 80
    response.cart.shippingCost = 0
    response.cart.total = 80
    validateCheckout.mockResolvedValue(response)

    const { wrapper } = await mountCheckout()
    await selectAndValidate(wrapper)

    expect(wrapper.get('[data-testid="shipping-cost"]').text()).toBe(
      'Gratis',
    )
    expect(wrapper.get('[data-testid="cart-total"]').text()
      .replace(/\s/g, '')).toBe('80,00€')
  })

  it('shows stock problems without a confirmed total', async () => {
    const response = validResponse()
    response.cart = {
      valid: false,
      items: [],
      issues: [{
        productId: 1,
        size: 'L',
        code: 'INSUFFICIENT_STOCK',
        availableStock: 0,
      }],
      subtotal: null,
      shippingCost: null,
      total: null,
      currency: 'EUR',
    }
    validateCheckout.mockResolvedValue(response)

    const { wrapper } = await mountCheckout()
    await selectAndValidate(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'unidades disponibles: 0',
    )
    expect(wrapper.get('[data-testid="cart-total"]').text()).toBe(
      'Pendiente de comprobar',
    )
    expect(wrapper.text()).not.toContain(
      'Dirección y disponibilidad comprobadas.',
    )
  })

  it('shows a connection error and allows retrying', async () => {
    validateCheckout.mockRejectedValueOnce(new Error('Network Error'))

    const { wrapper } = await mountCheckout()
    await selectAndValidate(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo comprobar la compra.',
    )
    expect(
      wrapper.get('[data-testid="validate-checkout"]').element.disabled,
    ).toBe(false)

    await wrapper.get('[data-testid="validate-checkout"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain(
      'Dirección y disponibilidad comprobadas.',
    )
  })
})