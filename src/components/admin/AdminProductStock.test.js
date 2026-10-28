import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminProductStock from './AdminProductStock.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

function render(stockBySize = { S: 5, M: 4 }) {
  wrapper = mount(AdminProductStock, {
    props: {
      product: {
        id: 7,
        name: 'Sudadera',
        stockBySize,
      },
    },
  })
  return wrapper
}

describe('AdminProductStock', () => {
  it('muestra las cantidades de cada talla', () => {
    render()

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.get('input[aria-label$="talla S"]').element.value).toBe('5')
    expect(wrapper.get('input[aria-label$="talla M"]').element.value).toBe('4')
  })

  it('guarda las cantidades modificadas, incluido cero', async () => {
    render()

    await wrapper.get('input[aria-label$="talla S"]').setValue('0')
    await wrapper.get('input[aria-label$="talla M"]').setValue('12')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, stockBySize: { S: 0, M: 12 } }],
    ])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it.each(['', '-1', '1.5', '2147483648'])(
    'rechaza la cantidad inválida "%s"',
    async (quantity) => {
      render()

      await wrapper.get('input[aria-label$="talla S"]').setValue(quantity)
      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('save')).toBeUndefined()
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'unidades enteras'
      )
    }
  )

  it('acepta el límite máximo permitido', async () => {
    render({ S: 0 })

    await wrapper.get('input').setValue('2147483647')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, stockBySize: { S: 2147483647 } }],
    ])
  })

  it('retira el error después de corregir una cantidad', async () => {
    render({ S: 5 })

    await wrapper.get('input').setValue('-1')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.get('input').setValue('3')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, stockBySize: { S: 3 } }],
    ])
  })

  it('muestra correctamente la talla única', async () => {
    render({ TU: 8 })

    expect(wrapper.text()).toContain('Talla única')
    expect(wrapper.get('input').attributes('aria-label')).toContain(
      'talla única'
    )

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, stockBySize: { TU: 8 } }],
    ])
  })

  it('reemplaza las tallas y limpia el error al cambiar de producto', async () => {
    render()

    await wrapper.get('input[aria-label$="talla S"]').setValue('-1')
    await wrapper.get('form').trigger('submit')

    await wrapper.setProps({
      product: {
        id: 8,
        name: 'Gorra',
        stockBySize: { TU: 2 },
      },
    })

    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.get('input').element.value).toBe('2')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 8, stockBySize: { TU: 2 } }],
    ])
  })

  it('no guarda cuando está deshabilitado', async () => {
    render()
    await wrapper.setProps({ disabled: true })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
