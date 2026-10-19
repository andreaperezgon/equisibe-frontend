import axios from 'axios'

const API_URL = 'http://localhost:8080/api'
const PRODUCTS_URL = `${API_URL}/admin/products`

const getCsrfConfig = async () => {
  const { data } = await axios.get(`${API_URL}/auth/csrf`, {
    withCredentials: true,
    timeout: 15000,
  })

  return {
    withCredentials: true,
    timeout: 15000,
    headers: {
      [data.headerName]: data.token,
    },
  }
}

const toPayload = (product) => ({
  name: product.name.trim(),
  description: product.description.trim(),
  price: product.price === '' || product.price == null
    ? null
    : Number(product.price),
  imageUrl: product.imageUrl.trim(),
  category: product.category.trim(),
})

export const getAdminProducts = async () => {
  const { data } = await axios.get(PRODUCTS_URL, {
    withCredentials: true,
    timeout: 15000,
  })

  return data
}

export const createAdminProduct = async (product) => {
  const config = await getCsrfConfig()
  const { data } = await axios.post(
    PRODUCTS_URL,
    toPayload(product),
    config,
  )

  return data
}

export const updateAdminProduct = async (productId, product) => {
  const config = await getCsrfConfig()
  const { data } = await axios.put(
    `${PRODUCTS_URL}/${encodeURIComponent(productId)}`,
    toPayload(product),
    config,
  )

  return data
}

export const setAdminProductActive = async (productId, active) => {
  const config = await getCsrfConfig()
  const { data } = await axios.put(
    `${PRODUCTS_URL}/${encodeURIComponent(productId)}/active`,
    { active },
    config,
  )

  return data
}

export const updateAdminProductStock = async (productId, stockBySize) => {
  const config = await getCsrfConfig()
  const { data } = await axios.put(
    PRODUCTS_URL + '/' + encodeURIComponent(productId) + '/stock',
    { stockBySize },
    config,
  )
  return data
}

export const updateAdminProductSale = async (productId, salePrice) => {
  const config = await getCsrfConfig()
  const { data } = await axios.put(
    PRODUCTS_URL + '/' + encodeURIComponent(productId) + '/sale',
    { salePrice },
    config,
  )
  return data
}

export const uploadAdminProductImage = async (file) => {
  const config = await getCsrfConfig()
  const body = new FormData()
  body.append('file', file)
  const { data } = await axios.post(
    API_URL + '/admin/product-images',
    body,
    { ...config, timeout: 120000 },
  )
  return data
}
