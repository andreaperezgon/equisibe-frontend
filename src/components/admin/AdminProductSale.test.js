import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminProductSale from './AdminProductSale.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

function render(overrides = {}, disabled = false) {
  wrapper = mount(AdminProductSale, {
    props: {
      product: {
        id: 7,
        name: 'Sudadera',
        price: 50,
        salePrice: null,
        ...overrides,
      },
      disabled,
    },
  })
  return wrapper
}

async function open() {
  await wrapper.get('button').trigger('click')
}

describe('AdminProductSale', () => {
  it('permite abrir y cerrar el formulario', async () => {
    render()
    expect(wrapper.find('form').exists()).toBe(false)

    await open()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')

    await open()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('guarda una rebaja válida con dos decimales', async () => {
    render()
    await open()
    await wrapper.get('input').setValue('39.95')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, salePrice: 39.95 }],
    ])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it.each(['', '0', '-1', '50', '60', '12.345'])(
    'rechaza el precio inválido "%s"',
    async (price) => {
      render()
      await open()
      await wrapper.get('input').setValue(price)
      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('save')).toBeUndefined()
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'mayor que cero y menor que el habitual'
      )
    }
  )

  it('borra el error al corregir el precio', async () => {
    render()
    await open()
    await wrapper.get('input').setValue('60')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.get('input').setValue('25')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, salePrice: 25 }],
    ])
  })

  it('muestra el precio anterior y permite quitar la rebaja', async () => {
    render({ salePrice: 30 })
    expect(wrapper.get('del').text()).toContain('50')
    expect(wrapper.get('strong').text()).toContain('30')

    await open()
    expect(Number(wrapper.get('input').element.value)).toBe(30)

    const remove = wrapper.findAll('button').find(
      button => button.text() === 'Quitar rebaja'
    )
    await remove.trigger('click')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 7, salePrice: null }],
    ])
  })

  it('actualiza el formulario cuando recibe otro producto', async () => {
    render({ salePrice: 30 })
    await open()

    await wrapper.setProps({
      product: {
        id: 8,
        name: 'Camisa',
        price: 40,
        salePrice: null,
      },
    })

    expect(wrapper.get('input').element.value).toBe('')
    await wrapper.get('input').setValue('20')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ productId: 8, salePrice: 20 }],
    ])
  })

  it('impide guardar mientras está deshabilitado', async () => {
    render()
    await open()
    await wrapper.get('input').setValue('25')
    await wrapper.setProps({ disabled: true })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
