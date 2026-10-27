import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './authStore'
import { getCurrentUser, logoutUser } from '../services/authService'

vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

const user = {
  id: 7,
  name: 'Cliente',
  email: 'cliente@example.com',
  role: 'CUSTOMER',
}

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
})

describe('authStore', () => {
  it('empieza sin sesión y sin haberla comprobado', () => {
    const store = useAuthStore()

    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isSessionChecked).toBe(false)
  })

  it('carga la cuenta y marca la sesión como comprobada', async () => {
    getCurrentUser.mockResolvedValue(user)
    const store = useAuthStore()

    await store.fetchCurrentUser()

    expect(store.user).toEqual(user)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isSessionChecked).toBe(true)
  })

  it('conserva el rol administrativo recibido del backend', async () => {
    getCurrentUser.mockResolvedValue({ ...user, role: 'ADMIN' })
    const store = useAuthStore()

    await store.fetchCurrentUser()

    expect(store.user.role).toBe('ADMIN')
  })

  it('indica que una nueva comprobación sigue pendiente', async () => {
    let finish
    getCurrentUser.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    const store = useAuthStore()
    store.isSessionChecked = true

    const pending = store.fetchCurrentUser()
    expect(store.isSessionChecked).toBe(false)

    finish(user)
    await pending

    expect(store.isSessionChecked).toBe(true)
    expect(store.user).toEqual(user)
  })

  it.each([401, 403])(
    'limpia la sesión ante una respuesta %s',
    async (status) => {
      getCurrentUser.mockRejectedValue({ response: { status } })
      const store = useAuthStore()
      store.user = user

      await expect(store.fetchCurrentUser()).resolves.toBeUndefined()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.isSessionChecked).toBe(true)
    }
  )

  it('propaga un fallo de conexión sin mantener datos de la sesión', async () => {
    const error = new Error('Sin conexión')
    getCurrentUser.mockRejectedValue(error)
    const store = useAuthStore()
    store.user = user

    await expect(store.fetchCurrentUser()).rejects.toBe(error)

    expect(store.user).toBeNull()
    expect(store.isSessionChecked).toBe(true)
  })

  it('limpia la cuenta después de cerrar sesión en el servidor', async () => {
    logoutUser.mockResolvedValue(undefined)
    const store = useAuthStore()
    store.user = user

    await store.logout()

    expect(logoutUser).toHaveBeenCalledTimes(1)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isSessionChecked).toBe(true)
  })

  it('informa si no puede confirmar el cierre de sesión', async () => {
    const error = new Error('Sin conexión')
    logoutUser.mockRejectedValue(error)
    const store = useAuthStore()
    store.user = user

    await expect(store.logout()).rejects.toBe(error)

    expect(store.user).toEqual(user)
  })
})
