import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminReturnsView from './AdminReturnsView.vue'
import { getAdminReturns, updateAdminReturn } from '../services/adminReturnService'

vi.mock('../services/adminReturnService', () => ({
  getAdminReturns: vi.fn(),
  updateAdminReturn: vi.fn(),
}))

const entry = {
  customerName: 'Andrea',
  customerEmail: 'andrea@example.com',
  request: {
    id: 7,
    orderId: 12,
    status: 'REQUESTED',
    createdAt: '2026-10-20T09:00:00Z',
    note: 'Quiero devolver esta prenda.',
    adminNote: '',
    items: [
      { lineIndex: 0, productName: 'Camisa', size: 'M', quantity: 1 },
    ],
  },
}

let wrapper

const render = async () => {
  wrapper = mount(AdminReturnsView, {
    global: {
      stubs: {
        AdminSectionNav: true,
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
  await flushPromises()
}

beforeEach(() => {
  vi.resetAllMocks()
  getAdminReturns.mockResolvedValue([entry])
  updateAdminReturn.mockResolvedValue({
    ...entry,
    request: {
      ...entry.request,
      status: 'IN_REVIEW',
      adminNote: 'Estamos revisando tu solicitud.',
    },
  })
})

afterEach(() => wrapper?.unmount())

describe('Devoluciones del administrador', () => {
  it('muestra cliente, pedido, prendas y comentario', async () => {
    await render()

    expect(wrapper.text()).toContain('Andrea')
    expect(wrapper.text()).toContain('andrea@example.com')
    expect(wrapper.text()).toContain('Pedido #12')
    expect(wrapper.text()).toContain('Camisa')
    expect(wrapper.text()).toContain('Quiero devolver esta prenda.')
  })

  it('guarda el estado y la respuesta para el cliente', async () => {
    await render()

    await wrapper.get('#return-status-7').setValue('IN_REVIEW')
    await wrapper.get('#return-response-7').setValue('Estamos revisando tu solicitud.')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(updateAdminReturn).toHaveBeenCalledWith(
      7, 'IN_REVIEW', 'Estamos revisando tu solicitud.',
    )
    expect(wrapper.text()).toContain('Solicitud #7 actualizada')
    expect(wrapper.get('#return-status-7').element.value).toBe('IN_REVIEW')
  })

  it('exige una explicación antes de rechazar', async () => {
    await render()

    await wrapper.get('#return-status-7').setValue('REJECTED')
    await wrapper.get('form').trigger('submit')

    expect(updateAdminReturn).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('Explica el motivo')
  })

  it('no permite saltar directamente de recibida a finalizada', async () => {
    await render()

    const values = wrapper.get('#return-status-7')
      .findAll('option').map(option => option.attributes('value'))

    expect(values).toContain('IN_REVIEW')
    expect(values).toContain('AWAITING_ITEMS')
    expect(values).not.toContain('CLOSED')
    expect(values).not.toContain('RECEIVED')
  })

  it('filtra por estado y muestra cuando no hay solicitudes', async () => {
    await render()

    await wrapper.get('#return-filter').setValue('CLOSED')

    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.text()).toContain('No hay devoluciones en este apartado.')
  })

  it('informa si otra operación ha cambiado la solicitud', async () => {
    updateAdminReturn.mockRejectedValue({ response: { status: 409 } })
    await render()

    await wrapper.get('#return-status-7').setValue('IN_REVIEW')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Actualiza la lista')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })
})
