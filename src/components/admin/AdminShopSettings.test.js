import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminShopSettings from './AdminShopSettings.vue'
import {
  getShopStatus,
  saveShopSettings,
} from '../../services/shopSettingsService'

vi.mock('../../services/shopSettingsService', () => ({
  getShopStatus: vi.fn(),
  saveShopSettings: vi.fn(),
}))

let wrapper

const initial = {
  closed: false,
  title: 'Volvemos pronto',
  text: 'Estamos preparando la colección.',
  countdownEnabled: false,
  countdownTarget: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  getShopStatus.mockResolvedValue({ ...initial })
  saveShopSettings.mockImplementation(async payload => ({ ...payload }))
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(AdminShopSettings)
  return wrapper
}

function closedCheckbox() {
  return wrapper.findAll('input[type="checkbox"]')[0]
}

function countdownCheckbox() {
  return wrapper.findAll('input[type="checkbox"]')[1]
}

describe('AdminShopSettings', () => {
  it('muestra la carga antes de enseñar el formulario', async () => {
    let finish
    getShopStatus.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()

    expect(wrapper.get('[role="status"]').text()).toContain(
      'Cargando configuración'
    )
    expect(wrapper.find('form').exists()).toBe(false)

    finish(initial)
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('carga el texto y el estado existentes', async () => {
    getShopStatus.mockResolvedValue({ ...initial, closed: true })
    render()
    await flushPromises()

    expect(closedCheckbox().element.checked).toBe(true)
    expect(countdownCheckbox().element.checked).toBe(false)
    expect(wrapper.get('input[maxlength="120"]').element.value).toBe(initial.title)
    expect(wrapper.get('textarea').element.value).toBe(initial.text)
    expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(false)
  })

  it.each([
    [true, 'Tienda cerrada'],
    [false, 'Tienda abierta'],
  ])('guarda el cierre %s e informa del resultado', async (closed, message) => {
    render()
    await flushPromises()

    await closedCheckbox().setValue(closed)
    await wrapper.get('input[maxlength="120"]').setValue('  Nueva colección  ')
    await wrapper.get('textarea').setValue('  Texto del aviso  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(saveShopSettings).toHaveBeenCalledWith({
      closed,
      title: 'Nueva colección',
      text: 'Texto del aviso',
      countdownEnabled: false,
      countdownTarget: null,
    })
    expect(wrapper.get('[role="status"]').text()).toContain(message)
  })

  it('impide activar la cuenta atrás sin una fecha', async () => {
    render()
    await flushPromises()
    await countdownCheckbox().setValue(true)
    await wrapper.get('form').trigger('submit')

    expect(saveShopSettings).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Indica la fecha y hora'
    )
  })

  it('convierte la fecha local a UTC al guardar', async () => {
    render()
    await flushPromises()
    await countdownCheckbox().setValue(true)
    await wrapper.get('input[type="datetime-local"]').setValue(
      '2026-10-27T15:30'
    )
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(saveShopSettings).toHaveBeenCalledWith({
      ...initial,
      countdownEnabled: true,
      countdownTarget: new Date(2026, 9, 27, 15, 30).toISOString(),
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('muestra una fecha existente en la hora local', async () => {
    getShopStatus.mockResolvedValue({
      ...initial,
      countdownEnabled: true,
      countdownTarget: new Date(2026, 9, 27, 15, 30).toISOString(),
    })
    render()
    await flushPromises()

    expect(countdownCheckbox().element.checked).toBe(true)
    expect(wrapper.get('input[type="datetime-local"]').element.value).toBe(
      '2026-10-27T15:30'
    )
  })

  it('elimina la fecha enviada al desactivar la cuenta atrás', async () => {
    getShopStatus.mockResolvedValue({
      ...initial,
      countdownEnabled: true,
      countdownTarget: new Date(2026, 9, 27, 15, 30).toISOString(),
    })
    render()
    await flushPromises()
    await countdownCheckbox().setValue(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(saveShopSettings).toHaveBeenCalledWith({
      ...initial,
      countdownEnabled: false,
      countdownTarget: null,
    })
    expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(false)
  })

  it('permite recargar después de un fallo al obtener la configuración', async () => {
    getShopStatus.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo cargar'
    )
    expect(wrapper.find('form').exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getShopStatus).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('conserva los datos escritos si falla el guardado', async () => {
    saveShopSettings.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()
    await wrapper.get('textarea').setValue('Aviso actualizado')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo guardar'
    )
    expect(wrapper.get('textarea').element.value).toBe('Aviso actualizado')
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toContain('Tienda abierta')
  })

  it('bloquea el formulario y evita guardar dos veces a la vez', async () => {
    let finish
    saveShopSettings.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await flushPromises()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Guardando…')

    await wrapper.get('form').trigger('submit')
    expect(saveShopSettings).toHaveBeenCalledTimes(1)

    finish(initial)
    await flushPromises()

    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[role="status"]').text()).toContain('Tienda abierta')
  })
})
