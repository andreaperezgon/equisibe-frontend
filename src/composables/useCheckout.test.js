import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useCheckout } from './useCheckout'
import { getShippingAddresses } from '../services/shippingAddressService'
import { validateCheckout } from '../services/checkoutService'
import {
  createOrder,
  createCheckoutSession,
  redirectToStripe,
  rememberOrderCart,
} from '../services/orderService'

let cart
let checkout
let wrapper

vi.mock('../stores/cartStore', () => ({
  useCartStore: () => cart,
}))
vi.mock('../services/shippingAddressService', () => ({
  getShippingAddresses: vi.fn(),
}))
vi.mock('../services/checkoutService', () => ({
  validateCheckout: vi.fn(),
}))
vi.mock('../services/orderService', () => ({
  createOrder: vi.fn(),
  createCheckoutSession: vi.fn(),
  redirectToStripe: vi.fn(),
  rememberOrderCart: vi.fn(),
}))

const address = { id: 1, countryCode: 'ES' }

function validResponse() {
  return {
    shippingAddress: address,
    cart: {
      valid: true,
      items: [{
        productId: 7,
        size: 'M',
        name: 'Camisa actualizada',
        unitPrice: 40,
      }],
      issues: [],
    },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  cart = reactive({
    items: [{
      productId: 7,
      size: 'M',
      quantity: 1,
      name: 'Camisa',
      price: 45,
    }],
  })
  getShippingAddresses.mockResolvedValue([address])
  validateCheckout.mockResolvedValue(validResponse())
  createOrder.mockResolvedValue({ id: 12 })
  createCheckoutSession.mockResolvedValue({
    url: 'https://checkout.stripe.com/c/pay/cs_test',
  })
})

afterEach(() => {
  wrapper?.unmount()
})

async function render() {
  wrapper = mount(defineComponent({
    setup() {
      checkout = useCheckout()
      return () => h('div')
    },
  }))
  await flushPromises()
  checkout.selectedAddressId.value = 1
}

describe('useCheckout', () => {
  it.each([
    ['INSUFFICIENT_STOCK', 'unidades disponibles: 2'],
    ['PRODUCT_UNAVAILABLE', 'ya no está disponible'],
    ['INVALID_SIZE', 'la talla no es válida'],
    ['OTRO', 'no se pudo confirmar su disponibilidad'],
  ])('explica la incidencia %s', async (code, message) => {
    validateCheckout.mockResolvedValue({
      cart: {
        valid: false,
        items: [],
        issues: [{
          productId: 7, size: 'M', code, availableStock: 2,
        }],
      },
    })
    await render()
    await checkout.checkCheckout()

    expect(checkout.isValid.value).toBe(false)
    expect(checkout.issues.value[0]).toContain('Camisa, talla M')
    expect(checkout.issues.value[0]).toContain(message)
  })

  it('describe una talla única aunque la prenda ya no esté en la cesta', async () => {
    validateCheckout.mockResolvedValue({
      cart: {
        valid: false,
        items: [],
        issues: [{
          productId: 99, size: 'TU', code: 'PRODUCT_UNAVAILABLE',
        }],
      },
    })
    await render()
    await checkout.checkCheckout()

    expect(checkout.issues.value[0]).toContain('Prenda, talla Única')
  })

  it.each([
    [401, '', 'Inicia sesión de nuevo'],
    [403, '', 'Inicia sesión de nuevo'],
    [404, '', 'La dirección ya no está disponible'],
    [400, 'EQUISIBE99', 'No se pudo aplicar el código'],
    [400, '', 'Solo realizamos envíos a España'],
    [500, '', 'No se pudo comprobar la compra'],
  ])('explica la validación rechazada con respuesta %s y código %s',
    async (status, code, message) => {
      validateCheckout.mockRejectedValue({ response: { status } })
      await render()
      checkout.promoCode.value = code
      await checkout.checkCheckout()

      expect(checkout.checkoutError.value).toContain(message)
      expect(checkout.checking.value).toBe(false)
      expect(checkout.result.value).toBeNull()
    }
  )

  it('actualiza nombre y precio con los datos validados', async () => {
    await render()
    await checkout.checkCheckout()

    expect(cart.items[0].name).toBe('Camisa actualizada')
    expect(cart.items[0].price).toBe(40)
  })

  it('no sustituye el precio de la cesta por un precio con código aplicado', async () => {
    const response = validResponse()
    response.cart.promoCode = 'EQUISIBE10'
    response.cart.items[0].unitPrice = 36
    validateCheckout.mockResolvedValue(response)
    await render()
    checkout.promoCode.value = 'EQUISIBE10'
    await checkout.checkCheckout()

    expect(cart.items[0].price).toBe(45)
    expect(validateCheckout.mock.calls[0][2]).toBe('EQUISIBE10')
  })

  it('ignora una validación antigua si cambia la cantidad', async () => {
    let finish
    validateCheckout.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    await render()

    const pending = checkout.checkCheckout()
    cart.items[0].quantity = 2

    finish(validResponse())
    await pending

    expect(checkout.result.value).toBeNull()
    expect(checkout.checking.value).toBe(false)
    expect(cart.items[0].price).toBe(45)
  })

  it('conserva la dirección seleccionada si sigue disponible', async () => {
    await render()
    await checkout.loadAddresses()

    expect(checkout.selectedAddressId.value).toBe(1)
  })

  it('retira la selección si la dirección deja de ser válida para España', async () => {
    await render()
    getShippingAddresses.mockResolvedValue([{ id: 1, countryCode: 'FR' }])
    await checkout.loadAddresses()

    expect(checkout.selectedAddressId.value).toBeNull()
    expect(checkout.canValidate.value).toBe(false)
  })

  it('muestra el fallo al recargar direcciones', async () => {
    await render()
    getShippingAddresses.mockRejectedValue(new Error('Sin conexión'))
    await checkout.loadAddresses()

    expect(checkout.addressError.value).toContain(
      'No se pudieron cargar tus direcciones'
    )
    expect(checkout.canValidate.value).toBe(false)
  })

  it('reintenta el pago usando el mismo pedido', async () => {
    createCheckoutSession.mockRejectedValueOnce(new Error('Sin conexión'))
    await render()
    await checkout.checkCheckout()
    await checkout.pay()

    expect(checkout.orderId.value).toBe(12)
    expect(checkout.paymentError.value).toContain('No se pudo abrir el pago')
    expect(rememberOrderCart).toHaveBeenCalledWith(12, expect.any(Array))
    expect(redirectToStripe).not.toHaveBeenCalled()

    await checkout.pay()

    expect(createOrder).toHaveBeenCalledTimes(1)
    expect(createCheckoutSession).toHaveBeenCalledTimes(2)
    expect(redirectToStripe).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test'
    )
    expect(checkout.paymentError.value).toBe('')
  })

  it('informa de un conflicto al crear el pedido sin abrir Stripe', async () => {
    createOrder.mockRejectedValue({ response: { status: 409 } })
    await render()
    await checkout.checkCheckout()
    await checkout.pay()

    expect(checkout.paymentError.value).toContain('La compra ha cambiado')
    expect(checkout.orderId.value).toBeNull()
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(redirectToStripe).not.toHaveBeenCalled()
  })

  it('no permite pagar sin una validación correcta', async () => {
    await render()
    await checkout.pay()

    expect(createOrder).not.toHaveBeenCalled()
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('no abre Stripe si se abandona la vista durante la creación del pedido', async () => {
    let finish
    createOrder.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    await render()
    await checkout.checkCheckout()

    const pending = checkout.pay()
    wrapper.unmount()
    wrapper = undefined

    finish({ id: 12 })
    await pending

    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(redirectToStripe).not.toHaveBeenCalled()
  })
})
