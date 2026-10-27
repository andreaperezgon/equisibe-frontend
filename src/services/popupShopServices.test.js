import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  getActivePopup,
  getAdminPopups,
  saveAdminPopup,
  setPopupActive,
  deleteAdminPopup,
  createPopupExamples,
} from './popupService'
import {
  getShopStatus,
  saveShopSettings,
} from './shopSettingsService'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const base = 'http://localhost:8080/api'
const readConfig = { withCredentials: true, timeout: 15000 }
const writeConfig = {
  ...readConfig,
  headers: { 'X-TEST-CSRF': 'test-token' },
}

const popup = {
  title: 'Bienvenida',
  text: 'Un descuento para tu compra.',
  promoCode: 'EQUISIBE10',
}

const settings = {
  closed: true,
  title: 'Volvemos pronto',
  text: 'Estamos preparando la colección.',
  countdownEnabled: false,
  countdownTarget: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-TEST-CSRF', token: 'test-token' },
  })
  axios.post.mockResolvedValue({ data: { id: 7 } })
  axios.put.mockResolvedValue({ data: { id: 7 } })
  axios.delete.mockResolvedValue({ status: 204 })
})

const writes = [
  [
    'crear anuncio',
    () => saveAdminPopup(null, popup),
    'post',
    `${base}/admin/popups`,
    popup,
  ],
  [
    'editar anuncio',
    () => saveAdminPopup(7, popup),
    'put',
    `${base}/admin/popups/7`,
    popup,
  ],
  [
    'activar anuncio',
    () => setPopupActive(7, true),
    'put',
    `${base}/admin/popups/7/active`,
    { active: true },
  ],
  [
    'desactivar anuncio',
    () => setPopupActive(7, false),
    'put',
    `${base}/admin/popups/7/active`,
    { active: false },
  ],
  [
    'eliminar anuncio',
    () => deleteAdminPopup(7),
    'delete',
    `${base}/admin/popups/7`,
    undefined,
  ],
  [
    'crear ejemplos',
    () => createPopupExamples(),
    'post',
    `${base}/admin/popups/examples`,
    {},
  ],
  [
    'guardar cierre de tienda',
    () => saveShopSettings(settings),
    'put',
    `${base}/admin/shop/settings`,
    settings,
  ],
]

describe('servicios de popups y tienda', () => {
  it('consulta el anuncio público y permite cancelar la petición', async () => {
    const controller = new AbortController()
    axios.get.mockResolvedValue({ status: 200, data: popup })

    expect(await getActivePopup(controller.signal)).toEqual(popup)
    expect(axios.get).toHaveBeenCalledWith(`${base}/popups/active`, {
      timeout: 15000,
      signal: controller.signal,
    })
  })

  it('devuelve null cuando no hay anuncio activo', async () => {
    axios.get.mockResolvedValue({ status: 204, data: '' })

    expect(await getActivePopup()).toBeNull()
  })

  it('consulta los anuncios administrativos con sesión', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 7, ...popup }] })

    expect(await getAdminPopups()).toEqual([{ id: 7, ...popup }])
    expect(axios.get).toHaveBeenCalledWith(
      `${base}/admin/popups`,
      readConfig
    )
  })

  it('consulta el estado público de Tienda y permite cancelar', async () => {
    const controller = new AbortController()
    axios.get.mockResolvedValue({ data: settings })

    expect(await getShopStatus(controller.signal)).toEqual(settings)
    expect(axios.get).toHaveBeenCalledWith(`${base}/shop/status`, {
      timeout: 15000,
      signal: controller.signal,
    })
  })

  it.each(writes)(
    '%s utiliza la ruta, el método y el token correctos',
    async (name, operation, method, url, payload) => {
      const result = await operation()

      expect(axios.get).toHaveBeenCalledWith(
        `${base}/auth/csrf`,
        readConfig
      )

      if (method === 'delete') {
        expect(axios.delete).toHaveBeenCalledWith(url, writeConfig)
        expect(result).toBeUndefined()
      } else {
        expect(axios[method]).toHaveBeenCalledWith(url, payload, writeConfig)
        expect(result).toEqual({ id: 7 })
      }

      expect(axios.get.mock.invocationCallOrder[0]).toBeLessThan(
        axios[method].mock.invocationCallOrder[0]
      )
    }
  )

  it.each(writes)(
    '%s no se envía si falla CSRF',
    async (name, operation) => {
      const error = new Error('Sin conexión')
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
      expect(axios.post).not.toHaveBeenCalled()
      expect(axios.put).not.toHaveBeenCalled()
      expect(axios.delete).not.toHaveBeenCalled()
    }
  )

  it.each(writes)(
    '%s propaga los errores del servidor',
    async (name, operation, method) => {
      const error = { response: { status: 403 } }
      axios[method].mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it.each([
    ['anuncio público', () => getActivePopup()],
    ['anuncios administrativos', () => getAdminPopups()],
    ['estado de tienda', () => getShopStatus()],
  ])('propaga el error al consultar %s', async (name, operation) => {
    const error = new Error('Sin conexión')
    axios.get.mockRejectedValue(error)

    await expect(operation()).rejects.toBe(error)
  })
})
