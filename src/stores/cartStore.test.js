import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from './cartStore'

const product = {
  id: 1,
  name: 'Camisa Equisibé',
  imageUrl: '/images/products/CAMISA.jpeg',
  price: 49.9,
  stockBySize: { S: 3, M: 0, L: 4, XL: 2 },
}

describe('cartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with an empty cart', () => {
    const cart = useCartStore()

    expect(cart.items).toEqual([])
    expect(cart.totalQuantity).toBe(0)
    expect(cart.subtotal).toBe(0)
  })

  it('adds a product with its selected size', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')

    expect(cart.items).toEqual([
      {
        productId: 1,
        name: product.name,
        imageUrl: product.imageUrl,
        price: 49.9,
        size: 'S',
        quantity: 1,
        stock: 3,
      },
    ])
  })

  it('groups repeated additions of the same product and size', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.addItem(product, 'S')

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(2)
    expect(cart.totalQuantity).toBe(2)
    expect(cart.subtotal).toBe(99.8)
  })

  it('keeps different sizes as separate items', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.addItem(product, 'L')

    expect(cart.items).toHaveLength(2)
    expect(cart.items.map((item) => item.size)).toEqual(['S', 'L'])
  })

  it('keeps different products as separate items', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.addItem({ ...product, id: 2 }, 'S')

    expect(cart.items).toHaveLength(2)
  })

  it.each(['', 'M', 'XXL'])(
    'rejects unavailable or missing size "%s"',
    (size) => {
      const cart = useCartStore()

      expect(() => cart.addItem(product, size)).toThrow(
        'Selecciona una talla disponible.',
      )
      expect(cart.items).toEqual([])
    },
  )

  it('does not add more units than available stock', () => {
    const cart = useCartStore()

    cart.addItem(product, 'XL')
    cart.addItem(product, 'XL')

    expect(() => cart.addItem(product, 'XL')).toThrow(
      'No hay más unidades disponibles de esta talla.',
    )
    expect(cart.items[0].quantity).toBe(2)
  })

  it('supports one-size products', () => {
    const cart = useCartStore()

    cart.addItem({
      ...product,
      id: 2,
      name: 'Gorra Equisibé',
      stockBySize: { TU: 5 },
    }, 'TU')

    expect(cart.items[0].size).toBe('TU')
    expect(cart.items[0].stock).toBe(5)
  })

  it('changes quantity and updates totals', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.setQuantity(1, 'S', 3)

    expect(cart.totalQuantity).toBe(3)
    expect(cart.subtotal).toBe(149.7)
  })

  it.each([0, -1, 1.5, NaN, '2'])(
    'rejects invalid quantity %s',
    (quantity) => {
      const cart = useCartStore()
      cart.addItem(product, 'S')

      expect(() => cart.setQuantity(1, 'S', quantity)).toThrow(
        'La cantidad debe ser un número entero mayor que cero.',
      )
      expect(cart.items[0].quantity).toBe(1)
    },
  )

  it('rejects a quantity above stock', () => {
    const cart = useCartStore()
    cart.addItem(product, 'S')

    expect(() => cart.setQuantity(1, 'S', 4)).toThrow(
      'No hay suficientes unidades de esta talla.',
    )
    expect(cart.items[0].quantity).toBe(1)
  })

  it('removes only the selected product and size', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.addItem(product, 'L')
    cart.removeItem(1, 'S')

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].size).toBe('L')
  })

  it('clears the cart and its totals', () => {
    const cart = useCartStore()

    cart.addItem(product, 'S')
    cart.clearCart()

    expect(cart.items).toEqual([])
    expect(cart.totalQuantity).toBe(0)
    expect(cart.subtotal).toBe(0)
  })
})