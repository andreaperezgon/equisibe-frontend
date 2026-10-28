import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPasswordView from './ResetPasswordView.vue'
import { resetPassword } from '../services/passwordResetService'

vi.mock('../services/passwordResetService', () => ({
  resetPassword: vi.fn(),
}))

const token = 'a'.repeat(43)

const render = async (withToken = true) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/reset-password', component: ResetPasswordView },
      { path: '/forgot-password', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })

  await router.push(`/reset-password${withToken ? `?token=${token}` : ''}`)
  await router.isReady()

  const wrapper = mount(ResetPasswordView, {
    global: { plugins: [createPinia(), router] },
  })

  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => vi.resetAllMocks())

describe('Recuperación de contraseña', () => {
  it('rechaza contraseñas diferentes sin enviar la petición', async () => {
    const { wrapper } = await render()

    await wrapper.get('#new-password').setValue('NewPassword123')
    await wrapper.get('#confirm-password').setValue('DifferentPassword123')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('no coinciden')
    expect(resetPassword).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('envía el enlace y la contraseña y muestra la confirmación', async () => {
    resetPassword.mockResolvedValue(undefined)
    const { wrapper, router } = await render()

    expect(router.currentRoute.value.query.token).toBeUndefined()

    await wrapper.get('#new-password').setValue('NewPassword123')
    await wrapper.get('#confirm-password').setValue('NewPassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(resetPassword).toHaveBeenCalledWith(token, 'NewPassword123')
    expect(wrapper.get('[role="status"]').text()).toContain('Contraseña actualizada')
    expect(wrapper.find('form').exists()).toBe(false)
    wrapper.unmount()
  })

  it('permite solicitar otro enlace si ha caducado', async () => {
    resetPassword.mockRejectedValue({ response: { status: 400 } })
    const { wrapper } = await render()

    await wrapper.get('#new-password').setValue('NewPassword123')
    await wrapper.get('#confirm-password').setValue('NewPassword123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('ha caducado')
    expect(wrapper.find('a[href="/forgot-password"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('no muestra el formulario si falta el enlace', async () => {
    const { wrapper } = await render(false)

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('enlace de recuperación válido')
    expect(resetPassword).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
