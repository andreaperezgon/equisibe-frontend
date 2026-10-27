import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { validateCart } from './cartService'
import { validateCheckout } from './checkoutService'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const base = 'http://localhost:8080/api'
const items = [{
  productId: 7,
  size: 'M',
  quantity: 2,
  price: 0.01,
  discount: 100,
  name: 'Dato que no debe enviarse',
}]
const cleanItems = [{ productId: 7, size: 'M', quantity: 2 }]
const config = {
  withCredentials: true,
  headers: { 'X-CSRF-TOKEN': 'test-token' },
}

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-CSRF-TOKEN', token: 'test-token' },
  })
  axios.post.mockResolvedValue({
    data: { valid: true, total: 80 },
  })
})

describe('validación de cesta y checkout', () => {
  it('valida la cesta sin enviar precios ni descuentos del navegador', async () => {
    const original = structuredClone(items)
    const result = await validateCart(items)

    expect(axios.post).toHaveBeenCalledWith(
      `${base}/cart/validate`,
      { items: cleanItems },
      config
    )
    expect(result).toEqual({ valid: true, total: 80 })
    expect(items).toEqual(original)
  })

  it('envía todos los productos con su talla y cantidad', async () => {
    await validateCart([
      ...items,
      { productId: 8, size: 'TU', quantity: 1, price: 5 },
    ])

    expect(axios.post.mock.calls[0][1]).toEqual({
      items: [
        ...cleanItems,
        { productId: 8, size: 'TU', quantity: 1 },
      ],
    })
  })

  it('permite que el backend valide una cesta vacía', async () => {
    await validateCart([])

    expect(axios.post).toHaveBeenCalledWith(
      `${base}/cart/validate`,
      { items: [] },
      config
    )
  })

  it.each([undefined, '', '   '])(
    'no añade un código promocional vacío: %j',
    async (code) => {
      await validateCheckout(12, items, code)

      expect(axios.post).toHaveBeenCalledWith(
        `${base}/checkout/validate`,
        { shippingAddressId: 12, items: cleanItems },
        config
      )
    }
  )

  it('normaliza el código y conserva la dirección seleccionada', async () => {
    const result = await validateCheckout(12, items, '  equisibe20  ')

    expect(axios.post).toHaveBeenCalledWith(
      `${base}/checkout/validate`,
      {
        shippingAddressId: 12,
        promoCode: 'EQUISIBE20',
        items: cleanItems,
      },
      config
    )
    expect(result).toEqual({ valid: true, total: 80 })
  })

  const operations = [
    ['cesta', () => validateCart(items)],
    ['checkout', () => validateCheckout(12, items)],
  ]

  it.each(operations)(
    '%s solicita CSRF con credenciales antes de enviar',
    async (name, operation) => {
      await operation()

      expect(axios.get).toHaveBeenCalledWith(`${base}/auth/csrf`, {
        withCredentials: true,
      })
      expect(axios.get.mock.invocationCallOrder[0]).toBeLessThan(
        axios.post.mock.invocationCallOrder[0]
      )
    }
  )

  it.each(operations)(
    '%s no envía datos si falla CSRF',
    async (name, operation) => {
      const error = new Error('Sin conexión')
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
      expect(axios.post).not.toHaveBeenCalled()
    }
  )

  it.each(operations)(
    '%s propaga los conflictos de validación del backend',
    async (name, operation) => {
      const error = { response: { status: 409 } }
      axios.post.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it('obtiene un token nuevo para cada operación', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { headerName: 'X-CSRF-TOKEN', token: 'primero' },
      })
      .mockResolvedValueOnce({
        data: { headerName: 'X-CSRF-TOKEN', token: 'segundo' },
      })

    await validateCart(items)
    await validateCheckout(12, items)

    expect(axios.post.mock.calls[0][2].headers).toEqual({
      'X-CSRF-TOKEN': 'primero',
    })
    expect(axios.post.mock.calls[1][2].headers).toEqual({
      'X-CSRF-TOKEN': 'segundo',
    })
  })
})
