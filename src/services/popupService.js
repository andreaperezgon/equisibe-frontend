import axios from 'axios'

const API = 'http://localhost:8080/api'

async function config() {
  const { data } = await axios.get(`${API}/auth/csrf`, {
    withCredentials: true, timeout: 15000,
  })
  return {
    withCredentials: true,
    timeout: 15000,
    headers: { [data.headerName]: data.token },
  }
}

export async function getActivePopup(signal) {
  const { data, status } = await axios.get(`${API}/popups/active`, {
    timeout: 15000, signal,
  })
  return status === 204 ? null : data
}

export async function getAdminPopups() {
  const { data } = await axios.get(`${API}/admin/popups`, {
    withCredentials: true, timeout: 15000,
  })
  return data
}

export async function saveAdminPopup(id, payload) {
  const options = await config()
  const response = id == null
    ? await axios.post(`${API}/admin/popups`, payload, options)
    : await axios.put(`${API}/admin/popups/${id}`, payload, options)
  return response.data
}

export async function setPopupActive(id, active) {
  const { data } = await axios.put(
    `${API}/admin/popups/${id}/active`, { active }, await config(),
  )
  return data
}

export async function deleteAdminPopup(id) {
  await axios.delete(`${API}/admin/popups/${id}`, await config())
}

export async function createPopupExamples() {
  const { data } = await axios.post(
    `${API}/admin/popups/examples`, {}, await config(),
  )
  return data
}
