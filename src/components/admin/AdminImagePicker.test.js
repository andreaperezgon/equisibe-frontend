import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminImagePicker from './AdminImagePicker.vue'
import { uploadAdminProductImage } from '../../services/adminProductService'

vi.mock('../../services/adminProductService', () => ({
  uploadAdminProductImage: vi.fn(),
}))

let wrapper

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  wrapper?.unmount()
})

function render(props = {}) {
  wrapper = mount(AdminImagePicker, { props })
  return wrapper
}

function image(name = 'prenda.jpg') {
  return new File(['imagen de prueba'], name, { type: 'image/jpeg' })
}

async function select(file) {
  const input = wrapper.get('input')
  Object.defineProperty(input.element, 'files', {
    value: file ? [file] : [],
    configurable: true,
  })
  await input.trigger('change')
  await flushPromises()
}

describe('AdminImagePicker', () => {
  it('no muestra vista previa cuando no hay imagen', () => {
    render()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('muestra la imagen existente con texto alternativo', () => {
    render({ modelValue: '/images/products/CAMISA.jpeg' })

    expect(wrapper.get('img').attributes('src')).toContain(
      '/images/products/CAMISA.jpeg'
    )
    expect(wrapper.get('img').attributes('alt')).toContain('Vista previa')
  })

  it('no sube nada si se cancela la selección', async () => {
    render()
    await select(null)

    expect(uploadAdminProductImage).not.toHaveBeenCalled()
    expect(wrapper.emitted('busy')).toBeUndefined()
  })

  it.each(['prenda.jpg', 'prenda.JPEG', 'prenda.png'])(
    'sube el archivo permitido %s',
    async (name) => {
      uploadAdminProductImage.mockResolvedValue({
        imageUrl: '/api/product-images/nueva.png',
      })
      render()
      const file = image(name)

      await select(file)

      expect(uploadAdminProductImage).toHaveBeenCalledWith(file)
      expect(wrapper.emitted('update:modelValue')).toEqual([
        ['/api/product-images/nueva.png'],
      ])
      expect(wrapper.emitted('busy')).toEqual([[true], [false]])
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    }
  )

  it('rechaza un formato no permitido', async () => {
    render()
    await select(image('documento.pdf'))

    expect(uploadAdminProductImage).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('JPG o PNG')
  })

  it('rechaza un archivo vacío', async () => {
    render()
    await select(new File([], 'vacia.png', { type: 'image/png' }))

    expect(uploadAdminProductImage).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('rechaza una imagen mayor de 10 MB', async () => {
    render()
    const file = image()
    Object.defineProperty(file, 'size', {
      value: 10 * 1024 * 1024 + 1,
    })

    await select(file)

    expect(uploadAdminProductImage).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('10 MB')
  })

  it.each([401, 403])(
    'pide iniciar sesión ante una respuesta %s',
    async (status) => {
      uploadAdminProductImage.mockRejectedValue({
        response: { status },
      })
      render()
      await select(image())

      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Vuelve a iniciar sesión'
      )
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('busy')).toEqual([[true], [false]])
    }
  )

  it('informa de un fallo de red y permite volver a seleccionar', async () => {
    uploadAdminProductImage.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await select(image())

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo subir la imagen'
    )
    expect(wrapper.get('input').attributes('disabled')).toBeUndefined()

    uploadAdminProductImage.mockResolvedValueOnce({
      imageUrl: '/api/product-images/recuperada.png',
    })
    await select(image())

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['/api/product-images/recuperada.png'],
    ])
  })

  it('bloquea otra subida mientras la primera sigue pendiente', async () => {
    let finish
    uploadAdminProductImage.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()

    await select(image())

    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[role="status"]').text()).toContain('Subiendo')

    await select(image('otra.png'))
    expect(uploadAdminProductImage).toHaveBeenCalledTimes(1)

    finish({ imageUrl: '/api/product-images/lista.png' })
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.emitted('busy')).toEqual([[true], [false]])
  })

  it('no emite una imagen cuando la subida termina tras salir de la vista', async () => {
    let finish
    const onBusy = vi.fn()
    const onImage = vi.fn()

    uploadAdminProductImage.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )

    render({
      onBusy,
      'onUpdate:modelValue': onImage,
    })

    await select(image())
    expect(onBusy).toHaveBeenCalledWith(true)

    wrapper.unmount()
    wrapper = undefined

    finish({ imageUrl: '/api/product-images/tardia.png' })
    await flushPromises()

    expect(onImage).not.toHaveBeenCalled()
    expect(onBusy).toHaveBeenCalledTimes(1)
  })

  it('deshabilita el selector cuando recibe la propiedad disabled', () => {
    render({ disabled: true })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})
