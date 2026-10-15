import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountOrders from './AccountOrders.vue'
import { getOrders } from '../../services/orderService'

vi.mock('../../services/orderService', () => ({ getOrders: vi.fn() }))
const wrappers = []
const open = () => {
  const wrapper = mount(AccountOrders, { global: { stubs: {
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  } } })
  wrappers.push(wrapper)
  return wrapper
}
const order = (id, status) => ({
  id, status, createdAt: '2026-10-15T08:00:00Z', total: 28.85, currency: 'EUR',
  items: [{ productId: 1, productName: 'Gorra Equisibé', size: 'TU', quantity: 1 }],
})
beforeEach(() => vi.resetAllMocks())
afterEach(() => { wrappers.forEach((wrapper) => wrapper.unmount()); wrappers.length = 0 })

describe('AccountOrders', () => {
  it('shows loading before the request completes', async () => {
    let finish
    getOrders.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const wrapper = open()
    expect(wrapper.get('[role="status"]').text()).toBe('Cargando tus pedidos…')
    expect(wrapper.get('button').element.disabled).toBe(true)
    finish([])
    await flushPromises()
    expect(wrapper.text()).toContain('Todavía no tienes pedidos.')
  })
  it('shows purchase dates, totals, products, statuses and links to their details', async () => {
    getOrders.mockResolvedValue([order(3, 'PENDING_PAYMENT'), order(2, 'PAID')])
    const wrapper = open()
    await flushPromises()
    expect(wrapper.findAll('[data-testid="account-order"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Gorra Equisibé · Talla Única · 1 ud.')
    expect(wrapper.text()).toContain('Pagado')
    expect(wrapper.text()).toContain('Pendiente de pago')
    expect(wrapper.text().replace(/\s/g, '')).toContain('28,85€')
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-10-15T08:00:00Z')
    expect(wrapper.get('a[href="/orders/3"]').text()).toBe('Ver pedido y continuar pago')
    expect(wrapper.get('a[href="/orders/2"]').text()).toBe('Ver pedido')
  })
  it('shows a store link when there are no orders', async () => {
    getOrders.mockResolvedValue([])
    const wrapper = open()
    await flushPromises()
    expect(wrapper.text()).toContain('Todavía no tienes pedidos.')
    expect(wrapper.get('a').attributes('href')).toBe('/shop')
  })
  it('allows retrying after a failed request', async () => {
    getOrders.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce([order(2, 'PAID')])
    const wrapper = open()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('No se pudieron cargar tus pedidos.')
    await wrapper.findAll('button').find((button) => button.text() === 'Reintentar').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pedido #2')
  })
  it('refreshes the payment status from the backend', async () => {
    getOrders.mockResolvedValueOnce([order(2, 'PENDING_PAYMENT')]).mockResolvedValueOnce([order(2, 'PAID')])
    const wrapper = open()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Pagado')
    expect(wrapper.text()).not.toContain('Pendiente de pago')
  })
  it('explains an expired session without showing any orders', async () => {
    getOrders.mockRejectedValue({ response: { status: 401 } })
    const wrapper = open()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Inicia sesión de nuevo')
    expect(wrapper.find('[data-testid="account-order"]').exists()).toBe(false)
  })
})
