import axios from 'axios'

const API = 'http://localhost:8080/api'

export async function getShopStatus(signal) {
  const { data } = await axios.get(`${API}/shop/status`, {
    timeout: 15000, signal,
  })
  return data
}

export async function saveShopSettings(payload) {
  const { data: csrf } = await axios.get(`${API}/auth/csrf`, {
    withCredentials: true, timeout: 15000,
  })
  const { data } = await axios.put(`${API}/admin/shop/settings`, payload, {
    withCredentials: true,
    timeout: 15000,
    headers: { [csrf.headerName]: csrf.token },
  })
  return data
}
