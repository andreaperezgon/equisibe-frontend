import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FavoriteButton from './FavoriteButton.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFavoriteStore } from '../../stores/favoriteStore'
import { getCurrentUser } from '../../services/authService'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../../services/favoriteService'

vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

vi.mock('../../services/favoriteService', () => ({
  getFavorites: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

let wrapper
let pinia
let auth
const product = { id: 7, name: 'Camisa' }
const user = { id: 1, email: 'cliente@example.com', role: 'CUSTOMER' }

beforeEach(() => {
  vi.resetAllMocks()
  pinia = createPinia()
  setActivePinia(pinia)
  auth = useAuthStore()
  auth.user = { ...user }
  getFavorites.mockResolvedValue([])
  addFavorite.mockResolvedValue(undefined)
  removeFavorite.mockResolvedValue(undefined)
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(FavoriteButton, {
    props: { product },
    global: {
      plugins: [pinia],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
  return wrapper
}

describe('FavoriteButton', () => {
  it('carga los favoritos y muestra el botón sin seleccionar', async () => {
    render()
    await flushPromises()

    expect(getFavorites).toHaveBeenCalledTimes(1)
    expect(wrapper.get('button').text()).toContain('Guardar en favoritos')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
  })

  it('guarda una prenda y actualiza el botón', async () => {
    render()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(addFavorite).toHaveBeenCalledWith(7)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('button').text()).toContain('Quitar de favoritos')
  })

  it('quita una prenda previamente guardada', async () => {
    getFavorites.mockResolvedValue([product])
    render()
    await flushPromises()

    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(removeFavorite).toHaveBeenCalledWith(7)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
  })

  it('pide iniciar sesión si no hay una cuenta activa', async () => {
    auth.user = null
    getCurrentUser.mockRejectedValue({ response: { status: 401 } })
    render()
    await flushPromises()

    expect(getFavorites).not.toHaveBeenCalled()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toContain('Inicia sesión')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/login')
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('recupera una sesión existente antes de guardar', async () => {
    auth.user = null
    getCurrentUser.mockResolvedValue(user)
    render()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getCurrentUser).toHaveBeenCalledTimes(1)
    expect(addFavorite).toHaveBeenCalledWith(7)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('bloquea el botón mientras carga los favoritos', async () => {
    let finish
    getFavorites.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button').text()).toContain('Actualizando')

    finish([])
    await flushPromises()

    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })

  it('informa del fallo de carga y permite volver a intentarlo', async () => {
    getFavorites.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar tus favoritos'
    )

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(addFavorite).toHaveBeenCalledWith(7)
  })

  it.each([
    [401, 'Inicia sesión', 'status'],
    [403, 'Inicia sesión', 'status'],
    [404, 'La prenda ya no está disponible', 'alert'],
    [500, 'No se pudo actualizar tu favorito', 'alert'],
  ])('explica una respuesta %s al guardar', async (status, message, role) => {
    addFavorite.mockRejectedValue({ response: { status } })
    render()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get(`[role="${role}"]`).text()).toContain(message)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })

  it('bloquea acciones duplicadas mientras guarda', async () => {
    let finish
    addFavorite.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await flushPromises()
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('button').trigger('click')
    expect(addFavorite).toHaveBeenCalledTimes(1)

    finish()
    await flushPromises()

    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('limpia el error al cambiar de producto', async () => {
    addFavorite.mockRejectedValue({ response: { status: 404 } })
    render()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.setProps({ product: { id: 8, name: 'Gorra' } })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
  })

  it('no muestra los favoritos de la cuenta anterior al cambiar de usuario', async () => {
    getFavorites.mockResolvedValueOnce([product])
    render()
    await flushPromises()
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')

    auth.user = { ...user, id: 2, email: 'otra@example.com' }
    await flushPromises()

    expect(getFavorites).toHaveBeenCalledTimes(2)
    expect(useFavoriteStore().items).toEqual([])
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
  })
})
