import axios from 'axios'

const API = 'http://localhost:8080/api'
const config = { withCredentials: true, timeout: 15000 }

export const getAdminReturns = async () => {
  const { data } = await axios.get(`${API}/admin/returns`, config)
  return data
}

export const updateAdminReturn = async (id, status, note) => {
  const { data: csrf } = await axios.get(`${API}/auth/csrf`, config)
  const { data } = await axios.put(
    `${API}/admin/returns/${encodeURIComponent(id)}/status`,
    { status, note },
    { ...config, headers: { [csrf.headerName]: csrf.token } },
  )
  return data
}
