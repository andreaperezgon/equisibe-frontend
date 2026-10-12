import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShippingAddressesView from './ShippingAddressesView.vue'
import ShippingAddressForm from '../components/account/ShippingAddressForm.vue'
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
} from '../services/shippingAddressService'

vi.mock('../services/shippingAddressService', () => ({
  getShippingAddresses: vi.fn(),
  createShippingAddress: vi.fn(),
  updateShippingAddress: vi.fn(),
}))

const address = {
  id: 1,
  recipientName: 'Cliente de prueba',
  phone: '600123456',
  addressLine1: 'Calle Mayor 10',
  addressLine2: '',
  city: 'Oviedo',
  province: 'Asturias',
  postalCode: '33001',
  countryCode: 'ES',
}

const { id, ...payload } = address
const wrappers = []

const mountView = async () => {
  const wrapper = mount(ShippingAddressesView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })

  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}

const clickButton = async (wrapper, text) => {
  const button = wrapper.findAll('button').find(
    (button) => button.text() === text,
  )

  expect(button).toBeDefined()
  await button.trigger('click')
}

describe('ShippingAddressesView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getShippingAddresses.mockResolvedValue([])
  })

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers.length = 0
  })

  it('shows the empty state', async () => {
    const wrapper = await mountView()

    expect(getShippingAddresses).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain(
      'Todavía no tienes direcciones guardadas.',
    )
  })

  it('loads and displays saved addresses', async () => {
    getShippingAddresses.mockResolvedValue([address])

    const wrapper = await mountView()

    expect(wrapper.get('li').text()).toContain('Calle Mayor 10')
    expect(wrapper.get('li').text()).toContain('Oviedo')
    expect(wrapper.get('li').text()).toContain('España')
  })

  it('creates an address and displays the saved result', async () => {
    createShippingAddress.mockResolvedValue(address)

    const wrapper = await mountView()
    await clickButton(wrapper, 'Añadir dirección')

    wrapper.getComponent(ShippingAddressForm).vm.$emit('save', payload)
    await flushPromises()

    expect(createShippingAddress).toHaveBeenCalledExactlyOnceWith(payload)
    expect(wrapper.get('li').text()).toContain('Calle Mayor 10')
    expect(wrapper.text()).toContain('Dirección guardada.')
    expect(wrapper.findComponent(ShippingAddressForm).exists()).toBe(false)
  })

  it('edits an existing address', async () => {
    getShippingAddresses.mockResolvedValue([address])
    const changes = { ...payload, city: 'Gijón' }
    updateShippingAddress.mockResolvedValue({ id, ...changes })

    const wrapper = await mountView()
    await clickButton(wrapper, 'Editar')

    const form = wrapper.getComponent(ShippingAddressForm)
    expect(form.props('address')).toEqual(address)

    form.vm.$emit('save', changes)
    await flushPromises()

    expect(updateShippingAddress).toHaveBeenCalledExactlyOnceWith(
      id,
      changes,
    )
    expect(wrapper.get('li').text()).toContain('Gijón')
    expect(wrapper.text()).toContain('Dirección actualizada.')
  })

  it('keeps the form open after a failed save', async () => {
    createShippingAddress.mockRejectedValue(new Error('Network Error'))

    const wrapper = await mountView()
    await clickButton(wrapper, 'Añadir dirección')

    wrapper.getComponent(ShippingAddressForm).vm.$emit('save', payload)
    await flushPromises()

    expect(wrapper.findComponent(ShippingAddressForm).exists()).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo guardar la dirección.',
    )
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.getComponent(ShippingAddressForm).props('saving')).toBe(false)
  })

  it('retries loading after an error', async () => {
    getShippingAddresses
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([address])

    const wrapper = await mountView()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar tus direcciones.',
    )

    await clickButton(wrapper, 'Reintentar')
    await flushPromises()

    expect(getShippingAddresses).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('li').text()).toContain('Calle Mayor 10')
  })

  it('cancels without calling the API', async () => {
    const wrapper = await mountView()
    await clickButton(wrapper, 'Añadir dirección')
    await clickButton(wrapper, 'Cancelar')

    expect(wrapper.findComponent(ShippingAddressForm).exists()).toBe(false)
    expect(createShippingAddress).not.toHaveBeenCalled()
    expect(updateShippingAddress).not.toHaveBeenCalled()
  })
})