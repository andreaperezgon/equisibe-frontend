import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from './adminOrderService'
import {
  getAdminReturns,
  updateAdminReturn,
} from './adminReturnService'
import {
  getOrderReturns,
  createReturnRequest,
} from './returnService'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const base = 'http://localhost:8080/api'
const readConfig = { withCredentials: true, timeout: 15000 }
const writeConfig = {
  ...readConfig,
  headers: { 'X-TEST-CSRF': 'test-token' },
}

const returnPayload = {
  clientRequestId: '38dd3776-b028-42a3-99a9-e2dfde8ba9d0',
  type: 'WITHDRAWAL',
  note: 'Solicito devolver esta prenda.',
  items: [{ lineIndex: 0, quantity: 1 }],
}

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-TEST-CSRF', token: 'test-token' },
  })
  axios.post.mockResolvedValue({ data: { id: 8 } })
  axios.put.mockResolvedValue({ data: { id: 8 } })
})

const reads = [
  [
    'pedidos administrativos',
    () => getAdminOrders(),
    `${base}/admin/orders`,
  ],
  [
    'devoluciones administrativas',
    () => getAdminReturns(),
    `${base}/admin/returns`,
  ],
  [
    'devoluciones de un pedido',
    () => getOrderReturns('7/otro'),
    `${base}/orders/7%2Fotro/returns`,
  ],
]

const writes = [
  [
    'estado del pedido',
    () => updateAdminOrderStatus('7/otro', 'SHIPPED'),
    'put',
    `${base}/admin/orders/7%2Fotro/status`,
    { status: 'SHIPPED' },
  ],
  [
    'respuesta a una devolución',
    () => updateAdminReturn('7/otro', 'IN_REVIEW', 'Estamos revisándolo'),
    'put',
    `${base}/admin/returns/7%2Fotro/status`,
    { status: 'IN_REVIEW', note: 'Estamos revisándolo' },
  ],
  [
    'solicitud de devolución',
    () => createReturnRequest('7/otro', returnPayload),
    'post',
    `${base}/orders/7%2Fotro/returns`,
    returnPayload,
  ],
]

describe('servicios de pedidos y devoluciones', () => {
  it.each(reads)(
    'consulta %s con sesión y tiempo máximo de espera',
    async (name, operation, url) => {
      const result = [{ id: 8 }]
      axios.get.mockResolvedValue({ data: result })

      expect(await operation()).toEqual(result)
      expect(axios.get).toHaveBeenCalledWith(url, readConfig)
      expect(axios.post).not.toHaveBeenCalled()
      expect(axios.put).not.toHaveBeenCalled()
    }
  )

  it.each(writes)(
    'envía %s con los datos y el token correctos',
    async (name, operation, method, url, payload) => {
      expect(await operation()).toEqual({ id: 8 })

      expect(axios.get).toHaveBeenCalledWith(
        `${base}/auth/csrf`,
        readConfig
      )
      expect(axios[method]).toHaveBeenCalledWith(
        url,
        payload,
        writeConfig
      )
      expect(axios.get.mock.invocationCallOrder[0]).toBeLessThan(
        axios[method].mock.invocationCallOrder[0]
      )
    }
  )

  it.each(writes)(
    'no envía %s si no se obtiene CSRF',
    async (name, operation) => {
      const error = new Error('Sin conexión')
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
      expect(axios.post).not.toHaveBeenCalled()
      expect(axios.put).not.toHaveBeenCalled()
    }
  )

  it.each(writes)(
    'propaga el rechazo del servidor al guardar %s',
    async (name, operation, method) => {
      const error = { response: { status: 403 } }
      axios[method].mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it.each(reads)(
    'propaga el error al consultar %s',
    async (name, operation) => {
      const error = { response: { status: 401 } }
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it('conserva el identificador de la devolución al reintentar', async () => {
    const original = structuredClone(returnPayload)
    const error = new Error('Respuesta perdida')
    axios.post
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: { id: 8 } })

    await expect(
      createReturnRequest(7, returnPayload)
    ).rejects.toBe(error)

    expect(await createReturnRequest(7, returnPayload)).toEqual({ id: 8 })

    expect(axios.post.mock.calls[0][1].clientRequestId).toBe(
      returnPayload.clientRequestId
    )
    expect(axios.post.mock.calls[1][1].clientRequestId).toBe(
      returnPayload.clientRequestId
    )
    expect(returnPayload).toEqual(original)
  })
})
