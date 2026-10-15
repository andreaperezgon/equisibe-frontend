import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './authStore'
import { useFavoriteStore } from './favoriteStore'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../services/favoriteService'

vi.mock('../services/favoriteService', () => ({
  getFavorites: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

const product = { id: 1, name: 'Sudadera', price: 54.9 }

const setup = () => {
  const auth = useAuthStore()
  auth.user = { id: 1, email: 'cliente@example.com' }
  return { auth, favorites: useFavoriteStore() }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  getFavorites.mockResolvedValue([])
  addFavorite.mockResolvedValue(undefined)
  removeFavorite.mockResolvedValue(undefined)
})

describe('favoriteStore', () => {
  it('loads saved favorites', async () => {
    getFavorites.mockResolvedValue([product])
    const { favorites } = setup()

    await favorites.load()

    expect(favorites.isFavorite(1)).toBe(true)
    expect(favorites.loaded).toBe(true)
  })

  it('adds and removes a favorite', async () => {
    const { favorites } = setup()

    await favorites.toggle(product)
    expect(addFavorite).toHaveBeenCalledExactlyOnceWith(1)
    expect(favorites.isFavorite(1)).toBe(true)

    await favorites.toggle(product)
    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith(1)
    expect(favorites.items).toEqual([])
  })

  it('does not show an unsaved favorite after a failed request', async () => {
    addFavorite.mockRejectedValue(new Error('Network Error'))
    const { favorites } = setup()

    await expect(favorites.toggle(product)).rejects.toThrow()

    expect(favorites.isFavorite(1)).toBe(false)
    expect(favorites.isBusy(1)).toBe(false)
  })

  it('blocks repeated clicks while saving', async () => {
    let finish
    addFavorite.mockImplementation(() => new Promise((resolve) => {
      finish = resolve
    }))
    const { favorites } = setup()
    await favorites.load()

    const first = favorites.toggle(product)
    const second = favorites.toggle(product)
    await flushPromises()

    expect(addFavorite).toHaveBeenCalledTimes(1)

    finish()
    await Promise.all([first, second])
    expect(favorites.items).toHaveLength(1)
  })

  it('clears favorites when logging out', async () => {
    getFavorites.mockResolvedValue([product])
    const { auth, favorites } = setup()
    await favorites.load()

    auth.user = null

    expect(favorites.items).toEqual([])
    expect(favorites.loaded).toBe(false)
  })

  it('ignores a previous accounts delayed response', async () => {
    let finish
    getFavorites.mockImplementation(() => new Promise((resolve) => {
      finish = resolve
    }))
    const { auth, favorites } = setup()
    const request = favorites.load()

    auth.user = { id: 2, email: 'otra@example.com' }
    finish([product])
    await request

    expect(favorites.items).toEqual([])
    expect(favorites.loaded).toBe(false)
  })

  it('does not add a previous accounts saved item to the new account', async () => {
    let finish
    addFavorite.mockImplementation(() => new Promise((resolve) => {
      finish = resolve
    }))
    const { auth, favorites } = setup()
    const request = favorites.toggle(product)
    await flushPromises()

    auth.user = { id: 2, email: 'otra@example.com' }
    finish()
    await request

    expect(favorites.items).toEqual([])
  })

  it('allows retrying after loading fails', async () => {
    getFavorites.mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([product])
    const { favorites } = setup()

    await expect(favorites.load()).rejects.toThrow()
    expect(favorites.loading).toBe(false)

    await favorites.load()
    expect(favorites.isFavorite(1)).toBe(true)
  })
})
