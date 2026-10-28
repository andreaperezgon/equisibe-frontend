import { defineStore } from 'pinia'

const subscribedCarts = new WeakSet()
const storageKey = (ownerId) => `equisibe-cart:v1:${ownerId}`

const readStoredItems = (ownerId) => {
  if (!ownerId) return []
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(storageKey(ownerId)))
    if (saved?.version !== 1 || !Array.isArray(saved.items) || saved.items.length > 100) return []
    const seen = new Set()
    return saved.items.flatMap((item) => {
      if (!item || !Number.isSafeInteger(item.productId) || item.productId <= 0 ||
          typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100 ||
          !['S', 'M', 'L', 'XL', 'TU'].includes(item.size) ||
          !Number.isSafeInteger(item.stock) || item.stock < 1 ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > item.stock ||
          typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) return []
      const key = `${item.productId}:${item.size}`
      if (seen.has(key)) return []
      seen.add(key)
      return [{
        productId: item.productId,
        name: item.name,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        stock: item.stock,
      }]
    })
  } catch {
    return []
  }
}

const saveStoredItems = (ownerId, items) => {
  if (!ownerId) return
  try {
    globalThis.localStorage.setItem(storageKey(ownerId), JSON.stringify({ version: 1, items }))
  } catch {
    // La cesta sigue funcionando si el navegador no permite guardar datos.
  }
}
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    ownerId: null,
  }),

  getters: {
    totalQuantity: (state) =>
      state.items.reduce((total, item) => total + item.quantity, 0),

    subtotal: (state) =>
      state.items.reduce(
        (total, item) =>
          total + Math.round(item.price * 100) * item.quantity,
        0,
      ) / 100,
  },

  actions: {
    setOwner(userId) {
      const value = userId == null ? '' : String(userId)
      const nextOwner = /^[1-9]\d*$/.test(value) ? value : null
      if (nextOwner !== this.ownerId) {
        // Cambiamos el propietario y su cesta juntos para no mezclar cuentas.
        this.$patch({ ownerId: nextOwner, items: readStoredItems(nextOwner) })
      }
      if (!subscribedCarts.has(this)) {
        this.$subscribe((_mutation, state) => {
          saveStoredItems(state.ownerId, state.items)
        }, { detached: true, flush: 'sync' })
        subscribedCarts.add(this)
      }
    },

    addItem(product, size) {
      const stock = product.stockBySize?.[size] ?? 0

      if (!size || !Number.isInteger(stock) || stock <= 0) {
        throw new Error('Selecciona una talla disponible.')
      }

      const existingItem = this.items.find(
        (item) => item.productId === product.id && item.size === size,
      )

      const nextQuantity = (existingItem?.quantity ?? 0) + 1

      if (nextQuantity > stock) {
        throw new Error('No hay más unidades disponibles de esta talla.')
      }

      if (existingItem) {
        existingItem.quantity = nextQuantity
        existingItem.stock = stock
        existingItem.price = product.price
        existingItem.name = product.name
        existingItem.imageUrl = product.imageUrl
      } else {
        this.items.push({
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          size,
          quantity: 1,
          stock,
        })
      }
    },

    setQuantity(productId, size, quantity) {
      const item = this.items.find(
        (item) => item.productId === productId && item.size === size,
      )

      if (!item) return

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('La cantidad debe ser un número entero mayor que cero.')
      }

      if (quantity > item.stock) {
        throw new Error('No hay suficientes unidades de esta talla.')
      }

      item.quantity = quantity
    },

    removeItem(productId, size) {
      this.items = this.items.filter(
        (item) => !(item.productId === productId && item.size === size),
      )
    },

    clearCart() {
      this.items = []
    },
  },
})