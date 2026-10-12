import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ShippingAddressForm from './ShippingAddressForm.vue'

const address = {
  id: 1,
  recipientName: 'Cliente de prueba',
  phone: '600123456',
  addressLine1: 'Calle Mayor 10',
  addressLine2: '2 B',
  city: 'Oviedo',
  province: 'Asturias',
  postalCode: '33001',
  countryCode: 'ES',
}

describe('ShippingAddressForm', () => {
  it('loads an existing address for editing', () => {
    const wrapper = mount(ShippingAddressForm, {
      props: { address },
    })

    expect(wrapper.get('h2').text()).toBe('Editar dirección')

    for (const key of [
      'recipientName',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'province',
      'postalCode',
    ]) {
      expect(wrapper.get(`[name="${key}"]`).element.value).toBe(
        address[key],
      )
    }
  })

  it('emits trimmed data with Spain fixed as the country', async () => {
    const wrapper = mount(ShippingAddressForm)

    for (const [key, value] of Object.entries(address)) {
      if (key === 'id' || key === 'countryCode') continue
      await wrapper.get(`[name="${key}"]`).setValue(value)
    }

    await wrapper.get('[name="recipientName"]').setValue(
      '  Cliente de prueba  ',
    )
    await wrapper.get('[name="addressLine2"]').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('save')[0][0]).toEqual({
      recipientName: 'Cliente de prueba',
      phone: '600123456',
      addressLine1: 'Calle Mayor 10',
      addressLine2: null,
      city: 'Oviedo',
      province: 'Asturias',
      postalCode: '33001',
      countryCode: 'ES',
    })

    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('rejects missing required fields', async () => {
    const wrapper = mount(ShippingAddressForm)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Completa todos los campos obligatorios.',
    )
  })

  it.each([
    ['postalCode', '1234', 'El código postal debe tener cinco cifras.'],
    ['phone', 'abcdefghi', 'Introduce un teléfono válido.'],
  ])('rejects an invalid %s', async (field, value, message) => {
    const wrapper = mount(ShippingAddressForm, {
      props: { address },
    })

    await wrapper.get(`[name="${field}"]`).setValue(value)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBe(message)
  })

  it('prevents duplicate submission while saving', async () => {
    const wrapper = mount(ShippingAddressForm, {
      props: { address, saving: true },
    })

    expect(wrapper.get('fieldset').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('keeps the entered data when the server reports an error', async () => {
    const wrapper = mount(ShippingAddressForm, {
      props: { address },
    })

    await wrapper.get('[name="city"]').setValue('Gijón')
    await wrapper.setProps({ error: 'No se pudo guardar la dirección.' })

    expect(wrapper.get('[name="city"]').element.value).toBe('Gijón')
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudo guardar la dirección.',
    )
  })

  it('emits cancel without saving', async () => {
    const wrapper = mount(ShippingAddressForm)

    await wrapper.get('button[type="button"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})