import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from './authService'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const base = 'http://localhost:8080/api/auth'
const credentials = {
  email: 'cliente@example.com',
  password: 'password-de-prueba',
}
const csrf = {
  headerName: 'X-TEST-CSRF',
  token: 'token-de-prueba',
}
const operations = [
  ['register', registerUser, credentials],
  ['login', loginUser, credentials],
  ['logout', logoutUser, null],
]

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({ data: csrf })
  axios.post.mockResolvedValue({ data: { id: 7 } })
})

describe('authService', () => {
  it.each(operations)(
    '%s solicita CSRF y envía la sesión y el token',
    async (endpoint, operation, payload) => {
      if (endpoint === 'logout') await operation()
      else await operation(payload)

      expect(axios.get).toHaveBeenCalledWith(`${base}/csrf`, {
        withCredentials: true,
      })
      expect(axios.post).toHaveBeenCalledWith(
        `${base}/${endpoint}`,
        payload,
        {
          withCredentials: true,
          headers: { 'X-TEST-CSRF': 'token-de-prueba' },
        }
      )
      expect(axios.get.mock.invocationCallOrder[0]).toBeLessThan(
        axios.post.mock.invocationCallOrder[0]
      )
    }
  )

  it('devuelve la cuenta creada por el servidor', async () => {
    const account = { id: 7, name: 'Cliente', role: 'CUSTOMER' }
    axios.post.mockResolvedValue({ data: account })

    expect(await registerUser(credentials)).toEqual(account)
  })

  it('consulta la cuenta actual usando la sesión', async () => {
    const account = { id: 7, role: 'ADMIN' }
    axios.get.mockResolvedValue({ data: account })

    expect(await getCurrentUser()).toEqual(account)
    expect(axios.get).toHaveBeenCalledWith(`${base}/me`, {
      withCredentials: true,
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it.each(operations)(
    '%s no envía la operación si falla CSRF',
    async (endpoint, operation, payload) => {
      const error = new Error('No se pudo obtener CSRF')
      axios.get.mockRejectedValue(error)

      await expect(operation(payload)).rejects.toBe(error)
      expect(axios.post).not.toHaveBeenCalled()
    }
  )

  it.each(operations)(
    '%s propaga los errores del servidor',
    async (endpoint, operation, payload) => {
      const error = { response: { status: 403 } }
      axios.post.mockRejectedValue(error)

      await expect(operation(payload)).rejects.toBe(error)
    }
  )

  it('propaga los errores al consultar la cuenta', async () => {
    const error = { response: { status: 401 } }
    axios.get.mockRejectedValue(error)

    await expect(getCurrentUser()).rejects.toBe(error)
  })
})
