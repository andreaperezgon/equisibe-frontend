import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import ForgotPasswordView from './ForgotPasswordView.vue'
import { requestPasswordReset } from '../services/passwordResetService'

vi.mock('../services/passwordResetService', () => ({
  requestPasswordReset: vi.fn(),
}))

let wrapper
const confirmation = 'Si existe una cuenta, recibirás un enlace.'

beforeEach(() => {
  vi.resetAllMocks()
  requestPasswordReset.mockResolvedValue({ message: confirmation })
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(ForgotPasswordView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('ForgotPasswordView', () => {
  it('ofrece el campo de correo y el acceso al login', () => {
    render()
    const input = wrapper.get('input')

    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('maxlength')).toBe('254')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/login')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('define la validación del formato de correo', async () => {
    render()
    const input = wrapper.get('input')

    await input.setValue('correo-invalido')
    expect(input.element.checkValidity()).toBe(false)

    await input.setValue('cliente@example.com')
    expect(input.element.checkValidity()).toBe(true)
  })

  it('envía el correo y muestra la confirmación del servidor', async () => {
    render()
    await wrapper.get('input').setValue('cliente@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(requestPasswordReset).toHaveBeenCalledWith('cliente@example.com')
    expect(wrapper.get('[role="status"]').text()).toBe(confirmation)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('bloquea los envíos duplicados mientras espera', async () => {
    let finish
    requestPasswordReset.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await wrapper.get('input').setValue('cliente@example.com')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button').text()).toBe('Enviando…')

    await wrapper.get('form').trigger('submit')
    expect(requestPasswordReset).toHaveBeenCalledTimes(1)

    finish({ message: confirmation })
    await flushPromises()

    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[role="status"]').text()).toBe(confirmation)
  })

  it('muestra el error de conexión y permite reintentar', async () => {
    requestPasswordReset.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await wrapper.get('input').setValue('cliente@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo solicitar el enlace'
    )
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe(confirmation)
  })

  it('no mantiene una confirmación anterior si falla la siguiente solicitud', async () => {
    render()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    requestPasswordReset.mockRejectedValueOnce(new Error('Sin conexión'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
