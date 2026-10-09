import axios from 'axios'

const PRODUCTS_URL = 'http://localhost:8080/api/products'

export const getProducts = async () => {
  const response = await axios.get(PRODUCTS_URL)

  return response.data
}

export const getProduct = async (id) => {
  const response = await axios.get(`${PRODUCTS_URL}/${id}`)

  return response.data
}