import axios from 'axios'

const AUTH_URL = 'http://localhost:8080/api/auth'

const post = async (path, data) => {
  const { data: csrf } = await axios.get(`${AUTH_URL}/csrf`, {
    withCredentials: true,
  })

  return axios.post(`${AUTH_URL}/${path}`, data, {
    withCredentials: true,
    headers: { [csrf.headerName]: csrf.token },
  })
}

export const requestPasswordReset = async (email) => {
  const { data } = await post('forgot-password', { email: email.trim() })
  return data
}

export const resetPassword = async (token, password) => {
  await post('reset-password', { token, password })
}
