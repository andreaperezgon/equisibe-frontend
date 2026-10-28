import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminProductForm from './AdminProductForm.vue'

let wrapper

const ImagePickerStub = {
  name: 'AdminImagePicker',
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue', 'busy'],
  template: '<div />',
}

afterEach(() => {
  wrapper?.unmount()
})

function render(props = {}) {
  wrapper = mount(AdminProductForm, {
    props,
    global: {
      stubs: { AdminImagePicker: ImagePickerStub },
    },
  })
  return wrapper
}

function picker() {
  return wrapper.getComponent({ name: 'AdminImagePicker' })
}

async function fill() {
  await wrapper.get('[name="name"]').setValue('Camisa')
  await wrapper.get('[name="description"]').setValue('Camisa de algodón')
  await wrapper.get('[name="price"]').setValue('39.95')
  await wrapper.get('[name="category"]').setValue('Camisas')
}

async function selectImage(url = '/api/product-images/camisa.png') {
  picker().vm.$emit('update:modelValue', url)
  await wrapper.vm.$nextTick()
}

const product = {
  id: 7,
  name: 'Sudadera',
  description: 'Sudadera artesanal',
  price: 50,
  imageUrl: '/images/products/SUDADERA.jpeg',
  category: 'Sudaderas',
}

describe('AdminProductForm', () => {
  it('muestra el formulario vacío para una prenda nueva', () => {
    render()

    expect(wrapper.get('h2').text()).toBe('Nueva prenda')
    expect(wrapper.get('[name="name"]').element.value).toBe('')
    expect(wrapper.get('[name="price"]').element.value).toBe('')
    expect(wrapper.text()).toContain('empiezan sin stock')
    expect(wrapper.get('[name="name"]').attributes('required')).toBeDefined()
    expect(wrapper.get('[name="description"]').attributes('required')).toBeDefined()
    expect(wrapper.get('[name="category"]').attributes('required')).toBeDefined()
    expect(wrapper.get('[name="price"]').attributes('step')).toBe('0.01')
  })

  it('envía los datos y la imagen elegida para crear una prenda', async () => {
    render()
    await fill()
    await selectImage()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{
        name: 'Camisa',
        description: 'Camisa de algodón',
        price: 39.95,
        imageUrl: '/api/product-images/camisa.png',
        category: 'Camisas',
      }],
    ])
  })

  it('impide guardar sin imagen y permite corregirlo', async () => {
    render()
    await fill()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Elige una imagen'
    )

    await selectImage()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('save')).toHaveLength(1)
  })

  it('carga los datos existentes y permite guardar una edición', async () => {
    render({ product })

    expect(wrapper.get('h2').text()).toBe('Editar prenda')
    expect(wrapper.get('[name="name"]').element.value).toBe('Sudadera')
    expect(wrapper.get('[name="description"]').element.value).toBe(
      'Sudadera artesanal'
    )
    expect(wrapper.get('[name="price"]').element.value).toBe('50')
    expect(wrapper.get('[name="category"]').element.value).toBe('Sudaderas')
    expect(picker().props('modelValue')).toBe(product.imageUrl)
    expect(wrapper.text()).not.toContain('empiezan sin stock')

    await wrapper.get('[name="name"]').setValue('Sudadera nueva')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'Sudadera nueva',
      description: product.description,
      price: 50,
      imageUrl: product.imageUrl,
      category: product.category,
    })
    expect(product.name).toBe('Sudadera')
  })

  it('actualiza los datos al seleccionar otra prenda', async () => {
    render({ product })

    await wrapper.setProps({
      product: {
        ...product,
        id: 8,
        name: 'Gorra',
        price: 20,
        imageUrl: '/images/products/GORRA.jpeg',
      },
    })

    expect(wrapper.get('[name="name"]').element.value).toBe('Gorra')
    expect(wrapper.get('[name="price"]').element.value).toBe('20')
    expect(picker().props('modelValue')).toBe('/images/products/GORRA.jpeg')
  })

  it('vacía el formulario al pasar de editar a crear', async () => {
    render({ product })
    await wrapper.setProps({ product: null })

    expect(wrapper.get('h2').text()).toBe('Nueva prenda')
    expect(wrapper.get('[name="name"]').element.value).toBe('')
    expect(wrapper.get('[name="price"]').element.value).toBe('')
    expect(picker().props('modelValue')).toBe('')
  })

  it('permite cancelar sin guardar', async () => {
    render()
    await wrapper.get('button[type="button"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('bloquea el guardado cuando está deshabilitado', async () => {
    render({ product, disabled: true })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Guardando…')
    expect(wrapper.get('button[type="button"]').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('espera a que termine la subida antes de permitir guardar', async () => {
    render({ product })
    picker().vm.$emit('busy', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button[type="submit"]').text()).toBe('Subiendo imagen…')
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()

    picker().vm.$emit('busy', false)
    await wrapper.vm.$nextTick()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toHaveLength(1)
  })
})
