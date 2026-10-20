import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OrderReturns from './OrderReturns.vue'
import { getOrderReturns, createReturnRequest } from '../../services/returnService'

vi.mock('../../services/returnService', () => ({
  getOrderReturns: vi.fn(),
  createReturnRequest: vi.fn(),
}))

const order = {
  id: 12,
  items: [
    { productName: 'Camisa', size: 'M', quantity: 2 },
  ],
}

const savedRequest = {
  id: 7,
  orderId: 12,
  status: 'REQUESTED',
  createdAt: '2026-10-20T09:00:00Z',
  items: [{ lineIndex: 0, productName: 'Camisa', size: 'M', quantity: 1 }],
  note: '',
  adminNote: '',
}

let wrapper

const render = async () => {
  wrapper = mount(OrderReturns, { props: { order } })
  await flushPromises()
  return wrapper
}

const openForm = async () => {
  const button = wrapper.findAll('button')
    .find(button => button.text() === 'Solicitar devolución')
  await button.trigger('click')
}

beforeEach(() => {
  vi.resetAllMocks()
  getOrderReturns.mockResolvedValue([])
  createReturnRequest.mockResolvedValue(savedRequest)
})

afterEach(() => wrapper?.unmount())

describe('Solicitudes de devolución', () => {
  it('permite corregir una cantidad después de un error', async () => {
    await render()
    await openForm()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('Selecciona al menos')
    expect(createReturnRequest).not.toHaveBeenCalled()
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)

    await wrapper.get('input[type="number"]').setValue('1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createReturnRequest).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Solicitud #7 recibida')
  })

  it('envía solo las unidades seleccionadas y permite no indicar motivo', async () => {
    await render()
    await openForm()
    await wrapper.get('input[type="number"]').setValue('1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createReturnRequest).toHaveBeenCalledWith(12, {
      clientRequestId: expect.any(String),
      type: 'WITHDRAWAL',
      note: '',
      items: [{ lineIndex: 0, quantity: 1 }],
    })
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Solicitud recibida')
  })

  it('rechaza cantidades superiores a las compradas', async () => {
    await render()
    await openForm()
    await wrapper.get('input[type="number"]').setValue('3')
    await wrapper.get('form').trigger('submit')

    expect(createReturnRequest).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('revisa las cantidades')
  })

  it('reutiliza la misma solicitud al reintentar tras un fallo de conexión', async () => {
    createReturnRequest.mockRejectedValueOnce(new Error('Sin conexión'))
    await render()
    await openForm()
    await wrapper.get('input[type="number"]').setValue('1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const firstPayload = createReturnRequest.mock.calls[0][1]
    expect(wrapper.get('button[type="submit"]').text()).toContain('Reintentar envío')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createReturnRequest).toHaveBeenCalledTimes(2)
    expect(createReturnRequest.mock.calls[1][1]).toEqual(firstPayload)
    expect(wrapper.text()).toContain('Solicitud #7 recibida')
  })

  it('no permite solicitar unidades que ya tienen una devolución', async () => {
    getOrderReturns.mockResolvedValue([{
      ...savedRequest,
      items: [{ ...savedRequest.items[0], quantity: 2 }],
    }])

    await render()

    expect(wrapper.text()).toContain('Solicitud #7')
    expect(wrapper.findAll('button').some(button =>
      button.text() === 'Solicitar devolución',
    )).toBe(false)
  })

  it('muestra la respuesta del taller y dirige las incidencias al correo', async () => {
    getOrderReturns.mockResolvedValue([{
      ...savedRequest,
      status: 'AWAITING_ITEMS',
      adminNote: 'Puedes enviar las prendas a la dirección del taller.',
    }])

    await render()

    expect(wrapper.text()).toContain('Pendiente de recibir las prendas')
    expect(wrapper.text()).toContain('Puedes enviar las prendas')
    expect(wrapper.get('a[href^="mailto:"]').attributes('href'))
      .toContain('equisibe@gmail.com')
  })
})
