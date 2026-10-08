import axios from 'axios'

const AUTH_URL = 'http://localhost:8080/api/auth'

const getCsrfConfig = async () => {
  const response = await axios.get(`${AUTH_URL}/csrf`, {
    withCredentials: true,
  })

  const { headerName, token } = response.data

  return {
    withCredentials: true,
    headers: {
      [headerName]: token,
    },
  }
}

export const registerUser = async (data) => {
  const config = await getCsrfConfig()

  const response = await axios.post(
    `${AUTH_URL}/register`,
    data,
    config,
  )

  return response.data
}

export const loginUser = async (data) => {
  const config = await getCsrfConfig()

  await axios.post(`${AUTH_URL}/login`, data, config)
}

export const getCurrentUser = async () => {
  const response = await axios.get(`${AUTH_URL}/me`, {
    withCredentials: true,
  })

  return response.data
}

export const logoutUser = async () => {
  const config = await getCsrfConfig()

  await axios.post(`${AUTH_URL}/logout`, null, config)
}