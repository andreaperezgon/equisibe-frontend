import axios from 'axios'

export const registerUser = async (data) => {
  const response = await axios.post(
    'http://localhost:8080/api/auth/register',
    data,
  )

  return response.data
}