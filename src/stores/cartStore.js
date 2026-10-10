import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
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