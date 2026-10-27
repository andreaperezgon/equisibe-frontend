import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import AdminOrdersView from './AdminOrdersView.vue'
import AdminOrderCard from '../components/admin/AdminOrderCard.vue'
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/adminOrderService'

vi.mock('../services/adminOrderService', () => ({
  getAdminOrders: vi.fn(),
  updateAdminOrderStatus: vi.fn(),
}))

let wrapper

beforeEach(() => {
  vi.resetAllMocks()
  getAdminOrders.mockResolvedValue([])
})

afterEach(() => {
  wrapper?.unmount()
})

function order(id, status) {
  return {
    id,
    status,
    createdAt: '2026-10-22T10:00:00Z',
    customerName: 'Cliente de prueba',
    customerEmail: 'cliente@example.com',
    currency: 'EUR',
    total: 43.95,
    shippingCost: 3.95,
    items: [{
      productId: 1,
      productName: 'Camisa',
      size: 'M',
      quantity: 1,
      lineTotal: 40,
    }],
    shippingAddress: {
      recipientName: 'Cliente de prueba',
      addressLine1: 'Calle de prueba 1',
      addressLine2: '',
      postalCode: '33001',
      city: 'Oviedo',
      province: 'Asturias',
      countryCode: 'ES',
      phone: '600000000',
    },
  }
}

function render() {
  wrapper = mount(AdminOrdersView, {
    global: {
      stubs: {
        AdminSectionNav: true,
        RouterLink: RouterLinkStub,
      },
    },
  })
  return wrapper
}

function button(label) {
  const found = wrapper.findAll('button').find(
    item => item.text().startsWith(label)
  )
  if (!found) throw new Error(`No se encontró el botón: ${label}`)
  return found
}

describe('AdminOrdersView', () => {
  it('muestra la carga y bloquea actualizar mientras espera', async () => {
    let finish
    getAdminOrders.mockReturnValue(new Promise(resolve => { finish = resolve }))
    render()

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Cargando pedidos')
    expect(button('Cargando').attributes('disabled')).toBeDefined()

    finish([])
    await flushPromises()

    expect(wrapper.text()).toContain('No hay pedidos en este apartado')
    expect(button('Actualizar pedidos').attributes('disabled')).toBeUndefined()
  })

  it('agrupa los pedidos y muestra los contadores correctos', async () => {
    getAdminOrders.mockResolvedValue([
      order(1, 'PAID'),
      order(2, 'PREPARING'),
      order(3, 'SHIPPED'),
      order(4, 'DELIVERED'),
      order(5, 'PENDING_PAYMENT'),
    ])
    render()
    await flushPromises()

    expect(button('En proceso').text()).toBe('En proceso (2)')
    expect(button('Enviados').text()).toBe('Enviados (1)')
    expect(button('Entregados').text()).toBe('Entregados (1)')
    expect(wrapper.findAllComponents(AdminOrderCard)).toHaveLength(2)

    await button('Enviados').trigger('click')
    expect(wrapper.getComponent(AdminOrderCard).props('order').id).toBe(3)

    await button('Entregados').trigger('click')
    expect(wrapper.getComponent(AdminOrderCard).props('order').id).toBe(4)
    expect(button('Entregados').attributes('aria-pressed')).toBe('true')
  })

  it.each([
    ['PAID', 'PREPARING', 'En proceso', 'en preparación'],
    ['PREPARING', 'SHIPPED', 'En proceso', 'Ya aparece en Enviados'],
    ['SHIPPED', 'DELIVERED', 'Enviados', 'Ya aparece en Entregados'],
  ])(
    'avanza de %s a %s',
    async (current, next, group, message) => {
      const original = order(7, current)
      getAdminOrders.mockResolvedValue([original])
      updateAdminOrderStatus.mockResolvedValue({ ...original, status: next })
      render()
      await flushPromises()
      await button(group).trigger('click')

      await wrapper.getComponent(AdminOrderCard).get('button').trigger('click')
      await flushPromises()

      expect(updateAdminOrderStatus).toHaveBeenCalledWith(7, next)
      expect(wrapper.get('[role="status"]').text()).toContain(message)

      const destination = next === 'SHIPPED'
        ? 'Enviados'
        : next === 'DELIVERED' ? 'Entregados' : 'En proceso'
      await button(destination).trigger('click')

      expect(wrapper.getComponent(AdminOrderCard).props('order').status).toBe(next)
    }
  )

  it.each([401, 403])(
    'retira los pedidos si la carga responde %s',
    async (status) => {
      getAdminOrders.mockResolvedValueOnce([order(1, 'PAID')])
      render()
      await flushPromises()

      getAdminOrders.mockRejectedValueOnce({ response: { status } })
      await button('Actualizar pedidos').trigger('click')
      await flushPromises()

      expect(wrapper.findAllComponents(AdminOrderCard)).toHaveLength(0)
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Vuelve a iniciar sesión'
      )
    }
  )

  it('permite reintentar una carga después de un fallo de red', async () => {
    getAdminOrders.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar los pedidos'
    )

    getAdminOrders.mockResolvedValueOnce([order(1, 'PAID')])
    await button('Actualizar pedidos').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAllComponents(AdminOrderCard)).toHaveLength(1)
  })

  it.each([401, 403])(
    'retira los datos si cambiar un estado responde %s',
    async (status) => {
      getAdminOrders.mockResolvedValue([order(1, 'PAID')])
      updateAdminOrderStatus.mockRejectedValue({ response: { status } })
      render()
      await flushPromises()

      await wrapper.getComponent(AdminOrderCard).get('button').trigger('click')
      await flushPromises()

      expect(wrapper.findAllComponents(AdminOrderCard)).toHaveLength(0)
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'cuenta administradora'
      )
    }
  )

  it('conserva el estado anterior si no puede confirmar el cambio', async () => {
    getAdminOrders.mockResolvedValue([order(1, 'PAID')])
    updateAdminOrderStatus.mockRejectedValue(new Error('Sin conexión'))
    render()
    await flushPromises()

    await wrapper.getComponent(AdminOrderCard).get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Actualiza los pedidos'
    )
    expect(wrapper.getComponent(AdminOrderCard).props('order').status).toBe('PAID')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('bloquea cambios duplicados mientras guarda', async () => {
    const original = order(1, 'PAID')
    let finish
    getAdminOrders.mockResolvedValue([original])
    updateAdminOrderStatus.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await flushPromises()

    const card = wrapper.getComponent(AdminOrderCard)
    await card.get('button').trigger('click')
    expect(card.get('button').text()).toBe('Actualizando…')
    expect(card.props('disabled')).toBe(true)

    card.vm.$emit('advance', original)
    await flushPromises()
    expect(updateAdminOrderStatus).toHaveBeenCalledTimes(1)

    finish({ ...original, status: 'PREPARING' })
    await flushPromises()

    expect(card.props('disabled')).toBe(false)
  })
})
