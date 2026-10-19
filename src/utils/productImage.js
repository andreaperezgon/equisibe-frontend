export const productImageUrl = (value) => {
  if (!value) return ''
  return value.startsWith('/api/product-images/')
    ? `http://localhost:8080${value}`
    : value
}
