import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const getAdminOrders = async () => {
  const { data } = await axios.get(`${API_URL}/admin/orders`, {
    withCredentials: true,
    timeout: 15000,
  })

  return data
}

export const updateAdminOrderStatus = async (orderId, status) => {
  const { data: csrf } = await axios.get(`${API_URL}/auth/csrf`, {
    withCredentials: true,
    timeout: 15000,
  })

  const { data } = await axios.put(
    `${API_URL}/admin/orders/${encodeURIComponent(orderId)}/status`,
    { status },
    {
      withCredentials: true,
      timeout: 15000,
      headers: {
        [csrf.headerName]: csrf.token,
      },
    },
  )

  return data
}
