import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

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

export const getFavorites = async () => {
  const { data } = await axios.get(`${API_URL}/favorites`, {
    withCredentials: true,
    timeout: 15000,
  })

  return data
}

export const addFavorite = async (productId) => {
  const config = await getCsrfConfig()

  await axios.put(
    `${API_URL}/favorites/${encodeURIComponent(productId)}`,
    {},
    config,
  )
}

export const removeFavorite = async (productId) => {
  const config = await getCsrfConfig()

  await axios.delete(
    `${API_URL}/favorites/${encodeURIComponent(productId)}`,
    config,
  )
}
