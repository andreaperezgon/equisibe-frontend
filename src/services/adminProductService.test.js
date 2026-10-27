import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  setAdminProductActive,
  updateAdminProductStock,
  updateAdminProductSale,
  uploadAdminProductImage,
} from './adminProductService'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const base = 'http://localhost:8080/api'
const productsUrl = `${base}/admin/products`
const config = {
  withCredentials: true,
  timeout: 15000,
  headers: { 'X-ADMIN-CSRF': 'test-token' },
}

const input = {
  name: '  Camisa  ',
  description: '  Algodón  ',
  price: '39.95',
  imageUrl: '  /images/products/CAMISA.jpeg  ',
  category: '  Camisas  ',
}

const clean = {
  name: 'Camisa',
  description: 'Algodón',
  price: 39.95,
  imageUrl: '/images/products/CAMISA.jpeg',
  category: 'Camisas',
}

beforeEach(() => {
  vi.resetAllMocks()
  axios.get.mockResolvedValue({
    data: { headerName: 'X-ADMIN-CSRF', token: 'test-token' },
  })
  axios.post.mockResolvedValue({ data: { id: 7 } })
  axios.put.mockResolvedValue({ data: { id: 7 } })
})

describe('adminProductService', () => {
  it('consulta los productos con sesión y tiempo máximo de espera', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 7 }] })

    expect(await getAdminProducts()).toEqual([{ id: 7 }])
    expect(axios.get).toHaveBeenCalledWith(productsUrl, {
      withCredentials: true,
      timeout: 15000,
    })
  })

  it('normaliza el producto antes de crearlo sin modificar el original', async () => {
    const original = { ...input }

    expect(await createAdminProduct(input)).toEqual({ id: 7 })
    expect(axios.post).toHaveBeenCalledWith(productsUrl, clean, config)
    expect(input).toEqual(original)
  })

  it.each(['', null, undefined])(
    'envía precio nulo cuando no se ha indicado: %j',
    async (price) => {
      await createAdminProduct({ ...input, price })

      expect(axios.post.mock.calls[0][1].price).toBeNull()
    }
  )

  it('actualiza el producto y codifica el identificador de la ruta', async () => {
    expect(await updateAdminProduct('7/otro', input)).toEqual({ id: 7 })

    expect(axios.put).toHaveBeenCalledWith(
      `${productsUrl}/7%2Fotro`,
      clean,
      config
    )
  })

  it.each([true, false])('envía la disponibilidad %s', async (active) => {
    expect(await setAdminProductActive(7, active)).toEqual({ id: 7 })

    expect(axios.put).toHaveBeenCalledWith(
      `${productsUrl}/7/active`,
      { active },
      config
    )
  })

  it('envía el stock por talla, incluidas las tallas agotadas', async () => {
    const stockBySize = { S: 0, M: 5, TU: 2 }

    expect(await updateAdminProductStock(7, stockBySize)).toEqual({ id: 7 })
    expect(axios.put).toHaveBeenCalledWith(
      `${productsUrl}/7/stock`,
      { stockBySize },
      config
    )
  })

  it.each([25, null])('envía el precio rebajado %s', async (salePrice) => {
    expect(await updateAdminProductSale(7, salePrice)).toEqual({ id: 7 })

    expect(axios.put).toHaveBeenCalledWith(
      `${productsUrl}/7/sale`,
      { salePrice },
      config
    )
  })

  it('sube la imagen como archivo y permite una espera mayor', async () => {
    const file = new File(['imagen'], 'camisa.png', { type: 'image/png' })
    axios.post.mockResolvedValue({
      data: { imageUrl: '/api/product-images/camisa.png' },
    })

    expect(await uploadAdminProductImage(file)).toEqual({
      imageUrl: '/api/product-images/camisa.png',
    })

    const [url, body, options] = axios.post.mock.calls[0]
    expect(url).toBe(`${base}/admin/product-images`)
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(options).toEqual({ ...config, timeout: 120000 })
    expect(options.headers).not.toHaveProperty('Content-Type')
  })

  const operations = [
    ['crear', () => createAdminProduct(input)],
    ['editar', () => updateAdminProduct(7, input)],
    ['activar', () => setAdminProductActive(7, true)],
    ['stock', () => updateAdminProductStock(7, { S: 5 })],
    ['rebaja', () => updateAdminProductSale(7, 25)],
    ['imagen', () => uploadAdminProductImage(
      new File(['imagen'], 'camisa.png', { type: 'image/png' })
    )],
  ]

  it.each(operations)(
    '%s solicita CSRF con sesión y tiempo máximo de espera',
    async (name, operation) => {
      await operation()

      expect(axios.get).toHaveBeenCalledWith(`${base}/auth/csrf`, {
        withCredentials: true,
        timeout: 15000,
      })
    }
  )

  it.each(operations)(
    '%s no envía la operación si falla CSRF',
    async (name, operation) => {
      const error = new Error('Sin conexión')
      axios.get.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
      expect(axios.post).not.toHaveBeenCalled()
      expect(axios.put).not.toHaveBeenCalled()
    }
  )

  it.each(operations)(
    '%s propaga los errores del servidor',
    async (name, operation) => {
      const error = { response: { status: 403 } }
      axios.post.mockRejectedValue(error)
      axios.put.mockRejectedValue(error)

      await expect(operation()).rejects.toBe(error)
    }
  )

  it('propaga los errores al consultar los productos', async () => {
    const error = { response: { status: 401 } }
    axios.get.mockRejectedValue(error)

    await expect(getAdminProducts()).rejects.toBe(error)
  })
})
