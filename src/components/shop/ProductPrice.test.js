import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductPrice from './ProductPrice.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

describe('ProductPrice', () => {
  it.each([
    { price: 40 },
    { price: 40, originalPrice: null },
    { price: 40, originalPrice: 40 },
    { price: 40, originalPrice: 30 },
  ])('no muestra una rebaja inexistente: %j', (product) => {
    wrapper = mount(ProductPrice, { props: { product } })

    expect(wrapper.find('del').exists()).toBe(false)
    expect(wrapper.find('.text-red-700').exists()).toBe(false)
    expect(wrapper.text()).toContain('40,00')
  })

  it.each([
    { price: 30, originalPrice: 40 },
    { price: '30', originalPrice: '40' },
  ])('muestra los precios anterior y rebajado: %j', (product) => {
    wrapper = mount(ProductPrice, { props: { product } })

    expect(wrapper.get('del').text()).toContain('40,00')
    expect(wrapper.get('.text-red-700').text()).toContain('30,00')
    expect(wrapper.text()).toContain('Precio anterior:')
    expect(wrapper.text()).toContain('Precio rebajado:')
  })

  it('actualiza el precio al aplicar y quitar una rebaja', async () => {
    wrapper = mount(ProductPrice, {
      props: { product: { price: 40 } },
    })

    await wrapper.setProps({
      product: { price: 29.95, originalPrice: 40 },
    })

    expect(wrapper.get('del').text()).toContain('40,00')
    expect(wrapper.get('.text-red-700').text()).toContain('29,95')

    await wrapper.setProps({ product: { price: 40 } })

    expect(wrapper.find('del').exists()).toBe(false)
    expect(wrapper.find('.text-red-700').exists()).toBe(false)
  })
})
