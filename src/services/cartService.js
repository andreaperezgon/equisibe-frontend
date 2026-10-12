import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const validateCart = async (items) => {
  const payload = {
    items: items.map((item) => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
    })),
  }

  const csrfResponse = await axios.get(`${API_URL}/auth/csrf`, {
    withCredentials: true,
  })

  const { headerName, token } = csrfResponse.data

  const response = await axios.post(
    `${API_URL}/cart/validate`,
    payload,
    {
      withCredentials: true,
      headers: {
        [headerName]: token,
      },
    },
  )

  return response.data
}