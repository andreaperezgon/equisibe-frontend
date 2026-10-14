import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { getShippingAddresses } from '../services/shippingAddressService'
import { validateCheckout } from '../services/checkoutService'
import { createOrder, createCheckoutSession, redirectToStripe, rememberOrderCart } from '../services/orderService'

export const useCheckout = () => {
  const cart = useCartStore()

  const addresses = ref([])
  const selectedAddressId = ref(null)
  const loadingAddresses = ref(true)
  const checking = ref(false)
  const addressError = ref('')
  const checkoutError = ref('')
  const result = ref(null)
  const paying = ref(false)
  const orderId = ref(null)
  const paymentError = ref('')

  let active = true
  let latestCheck = 0
  let latestLoad = 0

  const cartSignature = () =>
    JSON.stringify(
      cart.items.map(({ productId, size, quantity }) => ({
        productId,
        size,
        quantity,
      })),
    )

  const selectedAddress = computed(() =>
    addresses.value.find(
      (address) => address.id === selectedAddressId.value,
    ),
  )

  const canValidate = computed(() =>
    cart.items.length > 0 &&
    selectedAddress.value?.countryCode === 'ES' &&
    !loadingAddresses.value &&
    !addressError.value &&
    !checking.value &&
    !paying.value &&
    !orderId.value,
  )

  const isValid = computed(() => result.value?.cart.valid === true)

  const issues = computed(() =>
    (result.value?.cart.issues ?? []).map((issue) => {
      const item = cart.items.find(
        (item) =>
          item.productId === issue.productId &&
          item.size === issue.size,
      )

      const size = issue.size === 'TU' ? 'Única' : issue.size
      const label = `${item?.name ?? 'Prenda'}, talla ${size}`

      if (issue.code === 'INSUFFICIENT_STOCK') {
        return `${label}: unidades disponibles: ${issue.availableStock}. Revisa la cantidad en el carrito.`
      }

      if (issue.code === 'PRODUCT_UNAVAILABLE') {
        return `${label}: ya no está disponible. Elimínala del carrito.`
      }

      if (issue.code === 'INVALID_SIZE') {
        return `${label}: la talla no es válida para esta prenda.`
      }

      return `${label}: no se pudo confirmar su disponibilidad.`
    }),
  )

  const invalidate = () => {
    latestCheck += 1
    checking.value = false
    result.value = null
    checkoutError.value = ''
  }

  watch(
    [cartSignature, selectedAddressId],
    invalidate,
    { flush: 'sync' },
  )

  const describeError = (error, fallback) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      return 'No se pudo autorizar la operación. Inicia sesión de nuevo.'
    }

    if (status === 404) {
      return 'La dirección ya no está disponible. Recarga las direcciones y selecciona otra.'
    }

    if (status === 400) {
      return 'Revisa la cesta y la dirección. Solo realizamos envíos a España.'
    }

    return fallback
  }

  const loadAddresses = async () => {
    const requestId = ++latestLoad

    invalidate()
    loadingAddresses.value = true
    addressError.value = ''

    try {
      const data = await getShippingAddresses()

      if (!active || requestId !== latestLoad) return

      addresses.value = data

      const selectionExists = data.some(
        (address) =>
          address.id === selectedAddressId.value &&
          address.countryCode === 'ES',
      )

      if (!selectionExists) {
        selectedAddressId.value = null
      }
    } catch (error) {
      if (!active || requestId !== latestLoad) return

      addressError.value = describeError(
        error,
        'No se pudieron cargar tus direcciones. Inténtalo de nuevo.',
      )
    } finally {
      if (active && requestId === latestLoad) {
        loadingAddresses.value = false
      }
    }
  }

  const checkCheckout = async () => {
    if (!canValidate.value) return

    invalidate()
    checking.value = true

    const requestId = latestCheck
    const addressId = selectedAddressId.value
    const items = cart.items.map(({ productId, size, quantity }) => ({
      productId,
      size,
      quantity,
    }))

    try {
      const data = await validateCheckout(addressId, items)

      if (!active || requestId !== latestCheck) return

      if (data.cart.valid) {
        for (const validatedItem of data.cart.items) {
          const item = cart.items.find(
            (item) =>
              item.productId === validatedItem.productId &&
              item.size === validatedItem.size,
          )

          if (item) {
            item.price = validatedItem.unitPrice
            item.name = validatedItem.name
          }
        }
      }

      result.value = data
    } catch (error) {
      if (!active || requestId !== latestCheck) return

      checkoutError.value = describeError(
        error,
        'No se pudo comprobar la compra. Inténtalo de nuevo.',
      )
    } finally {
      if (active && requestId === latestCheck) {
        checking.value = false
      }
    }
  }

  const pay = async () => {
    if (paying.value || (!orderId.value && (!isValid.value || !canValidate.value))) return
    paying.value = true
    paymentError.value = ''
    try {
      if (!orderId.value) {
        const items = cart.items.map((item) => ({ ...item }))
        const order = await createOrder(selectedAddressId.value, items)
        orderId.value = order.id
        rememberOrderCart(order.id, items)
      }
      if (!active) return
      const session = await createCheckoutSession(orderId.value)
      if (active) redirectToStripe(session.url)
    } catch (error) {
      if (!active) return
      paymentError.value = error.response?.status === 409
        ? 'La compra ha cambiado o el pedido ya no admite el pago. Revisa el pedido y el carrito.'
        : describeError(error, 'No se pudo abrir el pago. Puedes volver a intentarlo.')
    } finally {
      if (active) paying.value = false
    }
  }

  onMounted(loadAddresses)

  onBeforeUnmount(() => {
    active = false
    latestCheck += 1
    latestLoad += 1
  })

  return {
    cart,
    addresses,
    selectedAddressId,
    loadingAddresses,
    checking,
    addressError,
    checkoutError,
    result,
    canValidate,
    isValid,
    issues,
    loadAddresses,
    checkCheckout,
    paying,
    orderId,
    paymentError,
    pay,
  }
}

