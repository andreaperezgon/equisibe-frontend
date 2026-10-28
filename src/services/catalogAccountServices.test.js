import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { getProducts, getProduct } from './productService'
import { getFavorites, addFavorite, removeFavorite } from './favoriteService'
import {
  getShippingAddresses,
  getShippingAddress,
  createShippingAddress,
  updateShippingAddress,
} from './shippingAddressService'
import { productImageUrl } from '../utils/productImage'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const base = 'http://localhost:8080/api'
const credentials = { withCredentials: true }
const token = { 'X-CSRF-TOKEN': 'test-token' }
const address = {
  recipientName: '  Cliente  ',
  phone: '  600000000  ',
  addressLine1: '  Calle de prueba 1  ',
  addressLine2: '  Segundo  ',
  city: '  Oviedo  ',
  province: '  Asturias  ',
  postalCode: '  33001  ',
  countryCode: '  es  ',
}
const cleanAddress = {
  recipientName: 'Cliente',
  phone: '600000000',
  addressLine1: 'Calle de prueba 1',
  addressLine2: 'Segundo',
  city: 'Oviedo',
  province: 'Asturias',
  postalCode: '33001',
  countryCode: 'ES',
}

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-CSRF-TOKEN', token: 'test-token' },
  })
  axios.post.mockResolvedValue({ data: { id: 7 } })
  axios.put.mockResolvedValue({ data: { id: 7 } })
  axios.delete.mockResolvedValue({ status: 204 })
})

const reads = [
  ['catálogo', () => getProducts(), `${base}/products`, null],
  ['producto', () => getProduct(7), `${base}/products/7`, null],
  [
    'favoritos',
    () => getFavorites(),
    `${base}/favorites`,
    { ...credentials, timeout: 15000 },
  ],
  [
    'direcciones',
    () => getShippingAddresses(),
    `${base}/addresses`,
    credentials,
  ],
  [
    'dirección individual',
    () => getShippingAddress('7/otro'),
    `${base}/addresses/7%2Fotro`,
    credentials,
  ],
]

const writes = [
  ['añadir favorito', () => addFavorite('7/otro')],
  ['quitar favorito', () => removeFavorite('7/otro')],
  ['crear dirección', () => createShippingAddress(address)],
  ['editar dirección', () => updateShippingAddress('7/otro', address)],
]

describe('servicios de catálogo, favoritos y direcciones', () => {
  it.each(reads)(
    'consulta %s con la ruta y opciones correctas',
    async (name, operation, url, options) => {
      axios.get.mockResolvedValue({ data: [{ id: 7 }] })

      expect(await operation()).toEqual([{ id: 7 }])
      if (options) expect(axios.get).toHaveBeenCalledWith(url, options)
      else expect(axios.get).toHaveBeenCalledWith(url)
    }
  )

  it('añade favoritos con CSRF y codifica el identificador', async () => {
    await addFavorite('7/otro')

    expect(axios.get).toHaveBeenCalledWith(`${base}/auth/csrf`, {
      ...credentials, timeout: 15000,
    })
    expect(axios.put).toHaveBeenCalledWith(
      `${base}/favorites/7%2Fotro`,
      {},
      { ...credentials, timeout: 15000, headers: token }
    )
  })

  it('quita favoritos con CSRF y sesión', async () => {
    await removeFavorite('7/otro')

    expect(axios.delete).toHaveBeenCalledWith(
      `${base}/favorites/7%2Fotro`,
      { ...credentials, timeout: 15000, headers: token }
    )
  })

  it('normaliza una dirección al crearla sin modificar el original', async () => {
    const original = { ...address }

    expect(await createShippingAddress(address)).toEqual({ id: 7 })
    expect(axios.get).toHaveBeenCalledWith(
      `${base}/auth/csrf`, credentials
    )
    expect(axios.post).toHaveBeenCalledWith(
      `${base}/addresses`,
      cleanAddress,
      { ...credentials, headers: token }
    )
    expect(address).toEqual(original)
  })

  it('normaliza y actualiza una dirección existente', async () => {
    expect(await updateShippingAddress('7/otro', address)).toEqual({ id: 7 })

    expect(axios.put).toHaveBeenCalledWith(
      `${base}/addresses/7%2Fotro`,
      cleanAddress,
      { ...credentials, headers: token }
    )
  })

  it.each([undefined, null, '', '   '])(
    'convierte campos opcionales vacíos en null: %j',
    async (value) => {
      await createShippingAddress({
        ...address,
        addressLine2: value,
        province: value,
      })

      expect(axios.post.mock.calls[0][1]).toEqual({
        ...cleanAddress,
        addressLine2: null,
        province: null,
      })
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
    async (name, operation) => {
      const error = { response: { status: 403 } }
      axios.post.mockRejectedValue(error)
      axios.put.mockRejectedValue(error)
      axios.delete.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it.each(reads)(
    'propaga los errores al consultar %s',
    async (name, operation) => {
      const error = new Error('Sin conexión')
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )
})

describe('direcciones de imágenes de producto', () => {
  it.each([
    [undefined, ''],
    [null, ''],
    ['', ''],
    ['/api/product-images/prenda.png', `${base}/product-images/prenda.png`],
    ['/images/products/CAMISA.jpeg', '/images/products/CAMISA.jpeg'],
    ['https://example.com/prenda.png', 'https://example.com/prenda.png'],
  ])('resuelve la imagen %j', (value, expected) => {
    expect(productImageUrl(value)).toBe(expected)
  })
})
