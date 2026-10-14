import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OrderView from './OrderView.vue'
import { getOrder, createCheckoutSession, redirectToStripe } from '../services/orderService'

const { route } = vi.hoisted(() => ({ route: { params: { id: '12' }, query: {} } }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('../services/orderService', () => ({
  getOrder: vi.fn(), createCheckoutSession: vi.fn(), redirectToStripe: vi.fn(), restoreOrderCart: vi.fn(),
}))
const response = (status) => ({
  id: 12, status, items: [{ productId: 1, productName: 'Sudadera', size: 'L', quantity: 1, lineTotal: 54.9 }],
  subtotal: 54.9, shippingCost: 3.95, total: 58.85, shippingAddress: {},
})
let wrapper
const openOrder = async () => {
  wrapper = mount(OrderView, { global: { plugins: [createPinia()] } })
  await flushPromises()
}
beforeEach(() => { vi.resetAllMocks(); route.query = {} })
afterEach(() => { wrapper?.unmount() })

describe('OrderView payment status', () => {
  it('does not confirm payment based on the return URL', async () => {
    route.query = { payment: 'returned' }
    getOrder.mockResolvedValue(response('PENDING_PAYMENT'))
    await openOrder()
    expect(wrapper.text()).toContain('Estamos esperando la confirmación del pago.')
    expect(wrapper.text()).not.toContain('Tu pago está confirmado.')
  })
  it('shows confirmation only for a paid order from the backend', async () => {
    getOrder.mockResolvedValue(response('PAID'))
    await openOrder()
    expect(wrapper.text()).toContain('Tu pago está confirmado.')
    expect(wrapper.find('[data-testid="retry-payment"]').exists()).toBe(false)
  })
  it('resumes payment for the same order after cancellation', async () => {
    route.query = { payment: 'cancelled' }
    getOrder.mockResolvedValue(response('PENDING_PAYMENT'))
    createCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    await openOrder()
    expect(wrapper.text()).toContain('Has vuelto sin completar el pago.')
    await wrapper.get('[data-testid="retry-payment"]').trigger('click')
    await flushPromises()
    expect(createCheckoutSession).toHaveBeenCalledExactlyOnceWith('12')
    expect(redirectToStripe).toHaveBeenCalledTimes(1)
  })
  it('updates to paid when the backend confirms a delayed payment', async () => {
    getOrder.mockResolvedValueOnce(response('PENDING_PAYMENT')).mockResolvedValueOnce(response('PAID'))
    await openOrder()
    const button = wrapper.findAll('button').find((button) => button.text() === 'Actualizar estado')
    await button.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Tu pago está confirmado.')
  })
})
