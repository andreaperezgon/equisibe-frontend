import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { requestPasswordReset, resetPassword } from './passwordResetService'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-CSRF-TOKEN', token: 'csrf-test' },
  })
  axios.post.mockResolvedValue({ data: { message: 'Respuesta genérica' } })
})

describe('Servicio de recuperación', () => {
  it('solicita el enlace con el correo y protección CSRF', async () => {
    const result = await requestPasswordReset(' cliente@example.com ')

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/csrf',
      { withCredentials: true },
    )
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/forgot-password',
      { email: 'cliente@example.com' },
      {
        withCredentials: true,
        headers: { 'X-CSRF-TOKEN': 'csrf-test' },
      },
    )
    expect(result.message).toBe('Respuesta genérica')
  })

  it('envía la contraseña sin modificar sus espacios', async () => {
    await resetPassword('token-test', ' Password123 ')

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/reset-password',
      { token: 'token-test', password: ' Password123 ' },
      {
        withCredentials: true,
        headers: { 'X-CSRF-TOKEN': 'csrf-test' },
      },
    )
  })

  it('no envía la contraseña si falla la obtención del CSRF', async () => {
    axios.get.mockRejectedValue(new Error('Sin conexión'))

    await expect(resetPassword('token-test', 'Password123')).rejects.toThrow()
    expect(axios.post).not.toHaveBeenCalled()
  })
})
