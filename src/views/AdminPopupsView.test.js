import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import AdminPopupsView from './AdminPopupsView.vue'
import * as api from '../services/popupService'

vi.mock('../services/popupService', () => ({
  getAdminPopups: vi.fn(),
  saveAdminPopup: vi.fn(),
  setPopupActive: vi.fn(),
  deleteAdminPopup: vi.fn(),
  createPopupExamples: vi.fn(),
}))

let wrapper

const popup = {
  id: 7,
  title: 'Bienvenida',
  text: 'Descuento de bienvenida',
  promoCode: 'EQUISIBE10',
  active: false,
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getAdminPopups.mockResolvedValue([{ ...popup }])
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(AdminPopupsView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        AdminSectionNav: true,
        AdminShopSettings: true,
      },
    },
  })
  return wrapper
}

function button(text) {
  const result = wrapper.findAll('button').find(item => item.text() === text)
  if (!result) throw new Error(`No se encontró: ${text}`)
  return result
}

describe('AdminPopupsView', () => {
  it('muestra los anuncios existentes', async () => {
    render()
    await flushPromises()

    expect(wrapper.text()).toContain('Bienvenida')
    expect(wrapper.text()).toContain('Descuento de bienvenida')
    expect(wrapper.text()).toContain('EQUISIBE10')
    expect(wrapper.text()).toContain('Desactivado')
  })

  it('muestra la carga y bloquea las acciones mientras espera', async () => {
    let finish
    api.getAdminPopups.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Cargando…')
    expect(button('Nuevo anuncio').attributes('disabled')).toBeDefined()

    finish([])
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay anuncios')
    expect(button('Nuevo anuncio').attributes('disabled')).toBeUndefined()
  })

  it('crea un anuncio recortando espacios y envía el código elegido', async () => {
    render()
    await flushPromises()
    await button('Nuevo anuncio').trigger('click')

    await wrapper.get('form input').setValue('  Oferta  ')
    await wrapper.get('form textarea').setValue('  Nueva colección  ')
    await wrapper.get('form select').setValue('EQUISIBE20')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.saveAdminPopup).toHaveBeenCalledWith(null, {
      title: 'Oferta',
      text: 'Nueva colección',
      promoCode: 'EQUISIBE20',
    })
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Anuncio creado y desactivado'
    )
    expect(wrapper.find('form').exists()).toBe(false)
    expect(api.getAdminPopups).toHaveBeenCalledTimes(2)
  })

  it('carga y guarda un anuncio existente sin código', async () => {
    render()
    await flushPromises()
    await button('Editar').trigger('click')

    expect(wrapper.get('form input').element.value).toBe('Bienvenida')
    expect(wrapper.get('form textarea').element.value).toBe(popup.text)
    expect(wrapper.get('form select').element.value).toBe('EQUISIBE10')

    await wrapper.get('form select').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.saveAdminPopup).toHaveBeenCalledWith(7, {
      title: popup.title,
      text: popup.text,
      promoCode: '',
    })
    expect(wrapper.get('[role="status"]').text()).toBe('Anuncio actualizado.')
  })

  it('permite cancelar la edición sin guardar', async () => {
    render()
    await flushPromises()
    await button('Editar').trigger('click')
    await button('Cancelar').trigger('click')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(api.saveAdminPopup).not.toHaveBeenCalled()
  })

  it.each([
    [false, 'Activar', true, 'Anuncio activado.'],
    [true, 'Desactivar', false, 'Anuncio desactivado.'],
  ])('cambia la activación desde %s', async (active, action, next, message) => {
    api.getAdminPopups.mockResolvedValue([{ ...popup, active }])
    render()
    await flushPromises()
    await button(action).trigger('click')
    await flushPromises()

    expect(api.setPopupActive).toHaveBeenCalledWith(7, next)
    expect(wrapper.get('[role="status"]').text()).toBe(message)
  })

  it('no elimina si se cancela la confirmación', async () => {
    render()
    await flushPromises()
    await button('Eliminar').trigger('click')

    expect(wrapper.text()).toContain('¿Eliminar este anuncio definitivamente?')
    expect(api.deleteAdminPopup).not.toHaveBeenCalled()

    await button('Cancelar').trigger('click')

    expect(wrapper.text()).not.toContain('¿Eliminar este anuncio definitivamente?')
    expect(api.deleteAdminPopup).not.toHaveBeenCalled()
  })

  it('elimina solo al confirmar y actualiza la lista', async () => {
    render()
    await flushPromises()
    await button('Eliminar').trigger('click')

    api.getAdminPopups.mockResolvedValueOnce([])
    await button('Sí, eliminar').trigger('click')
    await flushPromises()

    expect(api.deleteAdminPopup).toHaveBeenCalledWith(7)
    expect(wrapper.get('[role="status"]').text()).toBe('Anuncio eliminado.')
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('prepara los ejemplos de descuento', async () => {
    render()
    await flushPromises()
    await button('Crear ejemplos 10 % y 20 %').trigger('click')
    await flushPromises()

    expect(api.createPopupExamples).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Ejemplos preparados'
    )
    expect(api.getAdminPopups).toHaveBeenCalledTimes(2)
  })

  it.each([
    [401, 'cuenta administradora'],
    [403, 'cuenta administradora'],
    [400, 'Revisa el título'],
    [500, 'No se pudo completar la operación'],
  ])('explica una carga fallida con respuesta %s', async (status, message) => {
    api.getAdminPopups.mockRejectedValue({ response: { status } })
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(message)
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('conserva el formulario cuando no se puede guardar', async () => {
    api.saveAdminPopup.mockRejectedValue(new Error('Sin conexión'))
    render()
    await flushPromises()
    await button('Editar').trigger('click')
    await wrapper.get('form input').setValue('Título corregido')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo completar la operación'
    )
    expect(wrapper.get('form input').element.value).toBe('Título corregido')
    expect(button('Guardar anuncio').exists()).toBe(true)
  })

  it('permite reintentar después de un fallo de conexión', async () => {
    api.getAdminPopups.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await button('Actualizar lista').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Bienvenida')
  })
})
