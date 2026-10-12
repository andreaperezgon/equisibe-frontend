import axios from 'axios'

const API_URL = 'http://localhost:8080/api'
const ADDRESSES_URL = `${API_URL}/addresses`

const getCsrfConfig = async () => {
  const response = await axios.get(`${API_URL}/auth/csrf`, {
    withCredentials: true,
  })

  const { headerName, token } = response.data

  return {
    withCredentials: true,
    headers: {
      [headerName]: token,
    },
  }
}

const toPayload = (address) => ({
  recipientName: address.recipientName.trim(),
  phone: address.phone.trim(),
  addressLine1: address.addressLine1.trim(),
  addressLine2: address.addressLine2?.trim() || null,
  city: address.city.trim(),
  province: address.province?.trim() || null,
  postalCode: address.postalCode.trim(),
  countryCode: address.countryCode.trim().toUpperCase(),
})

export const getShippingAddresses = async () => {
  const response = await axios.get(ADDRESSES_URL, {
    withCredentials: true,
  })

  return response.data
}

export const getShippingAddress = async (id) => {
  const response = await axios.get(
    `${ADDRESSES_URL}/${encodeURIComponent(id)}`,
    {
      withCredentials: true,
    },
  )

  return response.data
}

export const createShippingAddress = async (address) => {
  const payload = toPayload(address)
  const config = await getCsrfConfig()

  const response = await axios.post(
    ADDRESSES_URL,
    payload,
    config,
  )

  return response.data
}

export const updateShippingAddress = async (id, address) => {
  const payload = toPayload(address)
  const config = await getCsrfConfig()

  const response = await axios.put(
    `${ADDRESSES_URL}/${encodeURIComponent(id)}`,
    payload,
    config,
  )

  return response.data
}