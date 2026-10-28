// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from './cartStore'
import { useAuthStore } from './authStore'
import { getCurrentUser, logoutUser } from '../services/authService'

vi.mock('../services/authService', () => ({ getCurrentUser: vi.fn(), logoutUser: vi.fn() }))

const product = { id: 1, name: 'Camisa', price: 40, imageUrl: '/images/products/CAMISA.jpeg', stockBySize: { S: 5 } }
const storedItem = { productId: 1, name: 'Camisa', price: 40, imageUrl: '/images/products/CAMISA.jpeg', size: 'S', quantity: 1, stock: 5 }
let entries
let storage
const key = (id) => `equisibe-cart:v1:${id}`
const saved = (id, value) => entries.set(key(id), JSON.stringify(value))
const reopen = (id) => {
  setActivePinia(createPinia())
  const cart = useCartStore()
  cart.setOwner(id)
  return cart
}

beforeEach(() => {
  vi.resetAllMocks()
  entries = new Map()
  storage = {
    getItem: vi.fn((name) => entries.get(name) ?? null),
    setItem: vi.fn((name, value) => entries.set(name, String(value))),
  }
  vi.stubGlobal('localStorage', storage)
  setActivePinia(createPinia())
})
afterEach(() => vi.unstubAllGlobals())

describe('cesta guardada por cuenta', () => {
  it('restaura las prendas y cantidades al abrir de nuevo el navegador', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.setQuantity(1, 'S', 3)
    const restored = reopen(1)
    expect(restored.items).toEqual([{ ...storedItem, quantity: 3 }])
    expect(restored.totalQuantity).toBe(3)
    expect(restored.subtotal).toBe(120)
  })

  it('no mezcla cuentas y recupera la cesta al volver a la anterior', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.setOwner(2)
    expect(cart.items).toEqual([])
    cart.addItem({ ...product, id: 2, name: 'Gorra' }, 'S')
    cart.setOwner(1)
    expect(cart.items).toEqual([storedItem])
    cart.setOwner(2)
    expect(cart.items.map((item) => item.productId)).toEqual([2])
  })

  it('limpia la cesta visible al salir pero permite recuperarla al volver a entrar', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.setOwner(null)
    expect(cart.items).toEqual([])
    expect(cart.ownerId).toBeNull()
    cart.setOwner(1)
    expect(cart.items).toEqual([storedItem])
  })

  it('volver a comprobar la misma cuenta no borra los cambios de la cesta', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.setQuantity(1, 'S', 2)
    cart.setOwner(1)
    cart.setOwner('1')
    expect(cart.items[0].quantity).toBe(2)
  })

  it('eliminar o vaciar la cesta también se conserva después de recargar', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.removeItem(1, 'S')
    expect(reopen(1).items).toEqual([])
    const next = useCartStore()
    next.addItem(product, 'S')
    next.clearCart()
    expect(reopen(1).items).toEqual([])
  })

  it('guarda también los precios actualizados por la validación y las restauraciones del pedido', () => {
    const cart = reopen(1)
    cart.addItem(product, 'S')
    cart.items[0].price = 35
    expect(reopen(1).items[0].price).toBe(35)
    useCartStore().items = [{ ...storedItem, quantity: 2 }]
    expect(reopen(1).items[0].quantity).toBe(2)
  })

  it.each([null, undefined, '', '0', '-1', 'invalid'])('no guarda una cesta sin cuenta válida: %s', (id) => {
    const cart = reopen(id)
    cart.addItem(product, 'S')
    expect(cart.ownerId).toBeNull()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it.each([
    'not JSON', 'null', '{"version":2,"items":[]}', '{"version":1,"items":{}}',
  ])('ignora un formato guardado dañado o incompatible: %s', (value) => {
    entries.set(key(1), value)
    expect(reopen(1).items).toEqual([])
  })

  it('no restaura una lista excesiva ni prendas con datos manipulados', () => {
    saved(1, { version: 1, items: Array.from({ length: 101 }, () => storedItem) })
    expect(reopen(1).items).toEqual([])
    saved(1, { version: 1, items: [
      null, { ...storedItem, productId: -1 }, { ...storedItem, price: -1 },
      { ...storedItem, name: '' }, { ...storedItem, size: 'INVALID' },
      { ...storedItem, quantity: 6 }, { ...storedItem, stock: 0 },
      storedItem, storedItem,
    ] })
    expect(reopen(1).items).toEqual([storedItem])
  })

  it('sigue funcionando cuando el navegador bloquea la lectura o la escritura', () => {
    storage.getItem.mockImplementation(() => { throw new Error('Storage blocked') })
    storage.setItem.mockImplementation(() => { throw new Error('Quota exceeded') })
    const cart = reopen(1)
    expect(() => cart.addItem(product, 'S')).not.toThrow()
    expect(cart.items).toHaveLength(1)
    expect(() => cart.setOwner(null)).not.toThrow()
    expect(cart.items).toEqual([])
  })

  it('la sesión restaura la cesta y el cierre de sesión oculta sus datos', async () => {
    saved(7, { version: 1, items: [storedItem] })
    const auth = useAuthStore()
    getCurrentUser.mockResolvedValue({ id: 7, name: 'Cliente', email: 'client@example.com', role: 'CUSTOMER' })
    await auth.fetchCurrentUser()
    expect(useCartStore().items).toEqual([storedItem])
    await auth.logout()
    expect(useCartStore().items).toEqual([])
    await auth.fetchCurrentUser()
    expect(useCartStore().items).toEqual([storedItem])
  })

  it.each([401, 403])('una sesión que ya no es válida oculta la cesta: %s', async (status) => {
    const cart = reopen(7)
    cart.addItem(product, 'S')
    getCurrentUser.mockRejectedValue({ response: { status } })
    await useAuthStore().fetchCurrentUser()
    expect(cart.items).toEqual([])
    expect(cart.ownerId).toBeNull()
    expect(reopen(7).items).toEqual([storedItem])
  })
})
