import axios from 'axios'

const API = 'http://localhost:8080/api'

export const getOrderReturns = async (orderId) => {
  const { data } = await axios.get(
    `${API}/orders/${encodeURIComponent(orderId)}/returns`,
    { withCredentials: true, timeout: 15000 },
  )
  return data
}

export const createReturnRequest = async (orderId, payload) => {
  const { data: csrf } = await axios.get(`${API}/auth/csrf`, {
    withCredentials: true,
    timeout: 15000,
  })

  const { data } = await axios.post(
    `${API}/orders/${encodeURIComponent(orderId)}/returns`,
    payload,
    {
      withCredentials: true,
      timeout: 15000,
      headers: { [csrf.headerName]: csrf.token },
    },
  )
  return data
}
