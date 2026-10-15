import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCheckoutSession, createOrder, getOrder, getOrders, redirectToStripe, rememberOrderCart, restoreOrderCart } from './orderService'

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear() })
describe('orderService', () => {
  it('requests only the authenticated users order history with a timeout', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 2, status: 'PAID' }] })
    expect(await getOrders()).toEqual([{ id: 2, status: 'PAID' }])
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/orders', {
      withCredentials: true, timeout: 15000,
    })
  })
  it('sends checkout requests with credentials and a fresh CSRF token', async () => {
    axios.get.mockResolvedValue({ data: { headerName: 'X-CSRF-TOKEN', token: 'test-token' } })
    axios.post.mockResolvedValue({ data: { id: 12 } })
    await createOrder(1, [{ productId: 2, size: 'S', quantity: 1, price: 0.01 }])
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/orders', {
      shippingAddressId: 1, items: [{ productId: 2, size: 'S', quantity: 1 }],
    }, { withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' } })
    await createCheckoutSession(12)
    expect(axios.post).toHaveBeenLastCalledWith('http://localhost:8080/api/orders/12/checkout-session', {}, {
      withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' },
    })
  })
  it('reads order status using the authenticated session', async () => {
    axios.get.mockResolvedValue({ data: { id: 12, status: 'PAID' } })
    expect(await getOrder(12)).toEqual({ id: 12, status: 'PAID' })
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/orders/12', { withCredentials: true })
  })
  it('rejects payment URLs outside Stripe', () => {
    for (const url of ['http://checkout.stripe.com/pay', 'https://checkout.stripe.com.evil.example/pay', 'javascript:alert(1)']) {
      expect(() => redirectToStripe(url)).toThrow()
    }
  })
  it('restores the original cart on an unpaid return and clears it only after confirmation', () => {
    const items = [{ productId: 2, size: 'S', quantity: 1 }]
    rememberOrderCart(12, items)
    const cart = { items: [], clearCart: vi.fn(function () { this.items = [] }) }
    restoreOrderCart(12, cart, false)
    expect(cart.items).toEqual(items)
    expect(cart.clearCart).not.toHaveBeenCalled()
    restoreOrderCart(12, cart, true)
    expect(cart.clearCart).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('equisibe-order-cart-12')).toBeNull()
  })
  it('preserves a cart changed since the payment started', () => {
    rememberOrderCart(12, [{ productId: 2, size: 'S', quantity: 1 }])
    const cart = { items: [{ productId: 3, size: 'L', quantity: 1 }], clearCart: vi.fn() }
    restoreOrderCart(12, cart, true)
    expect(cart.clearCart).not.toHaveBeenCalled()
  })
})
