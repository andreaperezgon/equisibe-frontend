import axios from 'axios'

export const registerUser = async (data) => {
  const response = await axios.post(
    'http://localhost:8080/api/auth/register',
    data,
  )

  return response.data
}

export const loginUser = async (data) => {
  await axios.post(
    'http://localhost:8080/api/auth/login',
    data,
    { withCredentials: true },
  )
}

export const getCurrentUser = async () => {
  const response = await axios.get(
    'http://localhost:8080/api/auth/me',
    { withCredentials: true },
  )

  return response.data
}

export const logoutUser = async () => {
  await axios.post(
    'http://localhost:8080/api/auth/logout',
    null,
    { withCredentials: true },
  )
}