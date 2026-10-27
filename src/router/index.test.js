import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { auth } = vi.hoisted(() => ({
  auth: {
    user: null,
    fetchCurrentUser: vi.fn(),
    get isAuthenticated() {
      return this.user !== null
    },
  },
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => auth,
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createWebHistory: actual.createMemoryHistory,
  }
})

import router from './index'

const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

beforeEach(async () => {
  auth.user = null
  auth.fetchCurrentUser.mockReset()
  auth.fetchCurrentUser.mockResolvedValue(undefined)
  await router.push('/')
  await router.isReady()
  auth.fetchCurrentUser.mockClear()
})

afterAll(() => {
  scroll.mockRestore()
})

describe('rutas de Equisibé', () => {
  it.each([
    '/shop',
    '/contact',
    '/privacy',
    '/returns',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ])('permite visitar %s sin iniciar sesión', async (path) => {
    await router.push(path)

    expect(router.currentRoute.value.path).toBe(path)
    expect(auth.fetchCurrentUser).not.toHaveBeenCalled()
  })

  it.each([
    '/account',
    '/account/addresses',
    '/checkout',
    '/orders/7',
  ])('redirige al login al intentar entrar sin sesión en %s', async (path) => {
    await router.push(path)

    expect(router.currentRoute.value.name).toBe('login')
    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('redirige al login si no puede comprobar la sesión', async () => {
    auth.fetchCurrentUser.mockRejectedValue(new Error('Sin conexión'))

    await router.push('/account')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('permite a un cliente consultar su cuenta', async () => {
    auth.user = { email: 'cliente@example.com', role: 'CUSTOMER' }

    await router.push('/account')

    expect(router.currentRoute.value.name).toBe('account')
    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
  })

  it.each([
    '/admin/orders',
    '/admin/products',
    '/admin/popups',
    '/admin/returns',
  ])('impide que un cliente acceda a %s', async (path) => {
    auth.user = { email: 'cliente@example.com', role: 'CUSTOMER' }

    await router.push(path)

    expect(router.currentRoute.value.name).toBe('account')
    expect(router.currentRoute.value.path).not.toBe(path)
  })

  it.each([
    '/admin/orders',
    '/admin/products',
    '/admin/popups',
    '/admin/returns',
  ])('permite al administrador entrar en %s', async (path) => {
    auth.user = { email: 'admin@example.com', role: 'ADMIN' }

    await router.push(path)

    expect(router.currentRoute.value.path).toBe(path)
    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('recupera la posición de desplazamiento guardada', () => {
    const position = { top: 200, left: 0 }

    expect(router.options.scrollBehavior(
      { path: '/shop' }, {}, position
    )).toEqual(position)
  })

  it('desplaza hasta la sección seleccionada de Mi cuenta', () => {
    expect(router.options.scrollBehavior(
      { path: '/account', hash: '#favorites' }, {}, null
    )).toEqual({
      el: '#favorites',
      top: 24,
      behavior: 'auto',
    })
  })

  it('vuelve al inicio de la página en una navegación normal', () => {
    expect(router.options.scrollBehavior(
      { path: '/shop', hash: '' }, {}, null
    )).toEqual({ top: 0 })
  })
})
