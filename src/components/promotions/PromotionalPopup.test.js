import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import PromotionalPopup from './PromotionalPopup.vue'
import { getActivePopup } from '../../services/popupService'

vi.mock('../../services/popupService', () => ({
  getActivePopup: vi.fn(),
}))

let wrapper
let showModal
let close
let writeText

const dialogPrototype = HTMLDialogElement.prototype
const originalShow = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close')
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

const popup = {
  id: 7,
  title: 'Bienvenida',
  text: 'Un descuento para tu primera compra.',
  promoCode: 'EQUISIBE10',
}

beforeEach(() => {
  vi.resetAllMocks()
  getActivePopup.mockResolvedValue({ ...popup })

  showModal = vi.fn(function () { this.open = true })
  close = vi.fn(function () { this.open = false })
  writeText = vi.fn().mockResolvedValue(undefined)

  Object.defineProperty(dialogPrototype, 'showModal', {
    value: showModal, configurable: true, writable: true,
  })
  Object.defineProperty(dialogPrototype, 'close', {
    value: close, configurable: true, writable: true,
  })
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText }, configurable: true,
  })
})

afterEach(() => {
  wrapper?.unmount()

  for (const [name, descriptor] of [
    ['showModal', originalShow],
    ['close', originalClose],
  ]) {
    if (descriptor) Object.defineProperty(dialogPrototype, name, descriptor)
    else delete dialogPrototype[name]
  }

  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard)
  } else {
    delete navigator.clipboard
  }
})

async function render(path = '/') {
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/shop', component: page },
      { path: '/account', component: page },
      { path: '/contact', component: page },
      { path: '/shop/:id', component: page },
    ],
  })

  await router.push(path)
  await router.isReady()

  wrapper = mount(PromotionalPopup, {
    attachTo: document.body,
    global: { plugins: [router] },
  })

  await flushPromises()
  return router
}

describe('PromotionalPopup', () => {
  it.each(['/', '/shop'])('muestra el anuncio en %s', async (path) => {
    await render(path)

    expect(getActivePopup).toHaveBeenCalledTimes(1)
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(wrapper.get('dialog').element.open).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Bienvenida')
    expect(wrapper.text()).toContain(popup.text)
    expect(wrapper.get('input').element.value).toBe('EQUISIBE10')
    expect(wrapper.get('input').attributes('readonly')).toBeDefined()
  })

  it.each(['/account', '/contact', '/shop/7'])(
    'no consulta ni abre anuncios en %s',
    async (path) => {
      await render(path)

      expect(getActivePopup).not.toHaveBeenCalled()
      expect(showModal).not.toHaveBeenCalled()
      expect(wrapper.find('h2').exists()).toBe(false)
    }
  )

  it('no abre el diálogo si no hay promoción activa', async () => {
    getActivePopup.mockResolvedValue(null)
    await render()

    expect(showModal).not.toHaveBeenCalled()
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('permite cerrar el anuncio', async () => {
    await render()
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(close).toHaveBeenCalled()
  })

  it('copia el código al portapapeles y confirma la acción', async () => {
    await render()
    const copy = wrapper.findAll('button').find(
      button => button.text() === 'Copiar código'
    )
    await copy.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('EQUISIBE10')
    expect(wrapper.get('[role="status"]').text()).toContain('¡Código copiado!')
  })

  it('selecciona el código si el portapapeles no está disponible', async () => {
    writeText.mockRejectedValue(new Error('No permitido'))
    await render()

    const copy = wrapper.findAll('button').find(
      button => button.text() === 'Copiar código'
    )
    await copy.trigger('click')
    await flushPromises()

    const input = wrapper.get('input').element
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe('EQUISIBE10'.length)
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Selecciona y copia el código'
    )
  })

  it('muestra anuncios informativos sin código ni botón de copiar', async () => {
    getActivePopup.mockResolvedValue({ ...popup, promoCode: '' })
    await render()

    expect(wrapper.get('h2').text()).toBe('Bienvenida')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('mantiene la página disponible si falla la consulta', async () => {
    getActivePopup.mockRejectedValue(new Error('Sin conexión'))
    await render()

    expect(showModal).not.toHaveBeenCalled()
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('vuelve a mostrar el anuncio al pasar de Inicio a Tienda', async () => {
    const router = await render()
    await wrapper.get('button').trigger('click')

    await router.push('/shop')
    await flushPromises()

    expect(getActivePopup).toHaveBeenCalledTimes(2)
    expect(showModal).toHaveBeenCalledTimes(2)
    expect(wrapper.get('dialog').element.open).toBe(true)
  })

  it('cierra el anuncio y cancela la consulta al salir de esas páginas', async () => {
    const router = await render()
    const signal = getActivePopup.mock.calls[0][0]

    await router.push('/account')
    await flushPromises()

    expect(signal.aborted).toBe(true)
    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(getActivePopup).toHaveBeenCalledTimes(1)
  })

  it('ignora una respuesta que llega después de abandonar Inicio', async () => {
    let finish
    getActivePopup.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    const router = await render()

    await router.push('/contact')
    finish(popup)
    await flushPromises()

    expect(showModal).not.toHaveBeenCalled()
    expect(wrapper.find('h2').exists()).toBe(false)
  })
})
