import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const createOrder = async (shippingAddressId, items) => {
  const payload = {
    shippingAddressId,
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

  const response = await axios.post(`${API_URL}/orders`, payload, {
    withCredentials: true,
    headers: {
      [headerName]: token,
    },
  })

  return response.data
}

export const getOrder = async (orderId) => {
  const response = await axios.get(
    `${API_URL}/orders/${encodeURIComponent(orderId)}`,
    {
      withCredentials: true,
    },
  )

  return response.data
}