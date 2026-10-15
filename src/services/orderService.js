import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

const post = async (path, payload) => {
  const { data: csrf } = await axios.get(`${API_URL}/auth/csrf`, { withCredentials: true })
  const { data } = await axios.post(`${API_URL}${path}`, payload, {
    withCredentials: true,
    headers: { [csrf.headerName]: csrf.token },
  })
  return data
}

export const createOrder = (shippingAddressId, items) => post('/orders', {
  shippingAddressId,
  items: items.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
})

export const createCheckoutSession = (orderId) =>
  post(`/orders/${encodeURIComponent(orderId)}/checkout-session`, {})

export const getOrders = async () => {
  const { data } = await axios.get(`${API_URL}/orders`, {
    withCredentials: true,
    timeout: 15000,
  })
  return data
}

export const getOrder = async (orderId) => {
  const { data } = await axios.get(`${API_URL}/orders/${encodeURIComponent(orderId)}`, {
    withCredentials: true,
  })
  return data
}

export const redirectToStripe = (url) => {
  const destination = new URL(url)
  if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
    throw new Error('La dirección de pago no es válida.')
  }
  window.location.assign(destination.href)
}

export const rememberOrderCart = (orderId, items) => {
  try {
    sessionStorage.setItem(`equisibe-order-cart-${orderId}`, JSON.stringify(items))
  } catch { /* El pago sigue disponible aunque no haya almacenamiento. */ }
}

export const restoreOrderCart = (orderId, cart, paid) => {
  try {
    const key = `equisibe-order-cart-${orderId}`
    const snapshot = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (!Array.isArray(snapshot)) return
    if (paid) {
      // No borramos prendas añadidas después de abrir el pago.
      if (JSON.stringify(cart.items) === JSON.stringify(snapshot)) cart.clearCart()
      sessionStorage.removeItem(key)
    } else if (cart.items.length === 0) {
      cart.items = snapshot
    }
  } catch { /* Una cesta guardada no debe impedir consultar el pedido. */ }
}
