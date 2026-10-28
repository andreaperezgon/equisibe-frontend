import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ShopAccessGate from './ShopAccessGate.vue'
import { getShopStatus } from '../../services/shopSettingsService'

vi.mock('../../services/shopSettingsService', () => ({
  getShopStatus: vi.fn(),
}))

let wrapper

const now = '2026-10-27T12:00:00Z'
const openStatus = {
  closed: false,
  title: 'Volvemos pronto',
  text: 'Estamos preparando la colección.',
  countdownEnabled: false,
  countdownTarget: null,
  serverNow: now,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({
    toFake: ['setInterval', 'clearInterval', 'Date'],
  })
  vi.setSystemTime(new Date(now))
  getShopStatus.mockResolvedValue({ ...openStatus })
})

afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function render() {
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/shop', component: page },
      { path: '/shop/:id', component: page },
    ],
  })
  await router.push('/shop')
  await router.isReady()

  wrapper = mount(ShopAccessGate, {
    slots: {
      default: '<div data-testid="catalog">Catálogo de prendas</div>',
    },
    global: {
      plugins: [router],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
  return router
}

function hasCatalog() {
  return wrapper.find('[data-testid="catalog"]').exists()
}

function countdownValues() {
  return wrapper.get('[role="timer"]').findAll('div').map(
    unit => unit.get('span').text()
  )
}

describe('ShopAccessGate', () => {
  it('oculta el catálogo mientras comprueba el estado', async () => {
    let finish
    getShopStatus.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    await render()

    expect(wrapper.get('[role="status"]').text()).toContain(
      'Comprobando disponibilidad'
    )
    expect(hasCatalog()).toBe(false)

    finish(openStatus)
    await flushPromises()

    expect(hasCatalog()).toBe(true)
  })

  it('permite ver el catálogo cuando la tienda está abierta', async () => {
    await render()
    await flushPromises()

    expect(hasCatalog()).toBe(true)
    expect(wrapper.find('#shop-closed-title').exists()).toBe(false)
  })

  it('muestra el aviso fijo sin catálogo ni botón de cerrar', async () => {
    getShopStatus.mockResolvedValue({ ...openStatus, closed: true })
    await render()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Volvemos pronto')
    expect(wrapper.text()).toContain('Estamos preparando la colección.')
    expect(hasCatalog()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.find('[role="timer"]').exists()).toBe(false)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/')
  })

  it('muestra y actualiza la cuenta atrás', async () => {
    getShopStatus.mockResolvedValue({
      ...openStatus,
      closed: true,
      countdownEnabled: true,
      countdownTarget: '2026-10-27T12:01:01Z',
    })
    await render()
    await flushPromises()

    expect(countdownValues()).toEqual(['00', '00', '01', '01'])

    await vi.advanceTimersByTimeAsync(2000)

    expect(countdownValues()).toEqual(['00', '00', '00', '59'])
    expect(hasCatalog()).toBe(false)
  })

  it('sigue cerrada cuando la cuenta atrás llega a cero', async () => {
    getShopStatus.mockResolvedValue({
      ...openStatus,
      closed: true,
      countdownEnabled: true,
      countdownTarget: '2026-10-27T12:00:01Z',
    })
    await render()
    await flushPromises()
    await vi.advanceTimersByTimeAsync(2000)

    expect(countdownValues()).toEqual(['00', '00', '00', '00'])
    expect(hasCatalog()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Volvemos pronto')
  })

  it('usa la hora del servidor para evitar un reloj local incorrecto', async () => {
    getShopStatus.mockResolvedValue({
      ...openStatus,
      closed: true,
      countdownEnabled: true,
      serverNow: '2026-10-27T14:00:00Z',
      countdownTarget: '2026-10-27T14:01:00Z',
    })
    await render()
    await flushPromises()

    expect(countdownValues()).toEqual(['00', '00', '01', '00'])
  })

  it('mantiene el cierre aunque la fecha de cuenta atrás sea inválida', async () => {
    getShopStatus.mockResolvedValue({
      ...openStatus,
      closed: true,
      countdownEnabled: true,
      countdownTarget: 'fecha inválida',
    })
    await render()
    await flushPromises()

    expect(wrapper.find('[role="timer"]').exists()).toBe(false)
    expect(hasCatalog()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Volvemos pronto')
  })

  it('bloquea el catálogo ante un fallo y permite reintentar', async () => {
    getShopStatus.mockRejectedValueOnce(new Error('Sin conexión'))
    await render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No podemos comprobar'
    )
    expect(hasCatalog()).toBe(false)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(hasCatalog()).toBe(true)
  })

  it('no permite entrar si el servidor devuelve un estado inválido', async () => {
    getShopStatus.mockResolvedValue({ ...openStatus, closed: 'false' })
    await render()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(hasCatalog()).toBe(false)
  })

  it('detecta la apertura manual en la siguiente consulta periódica', async () => {
    getShopStatus.mockResolvedValueOnce({ ...openStatus, closed: true })
    await render()
    await flushPromises()

    expect(hasCatalog()).toBe(false)

    getShopStatus.mockResolvedValue(openStatus)
    await vi.advanceTimersByTimeAsync(15000)
    await flushPromises()

    expect(hasCatalog()).toBe(true)
    expect(wrapper.find('#shop-closed-title').exists()).toBe(false)
  })

  it('vuelve a comprobar el estado al cambiar de página', async () => {
    const router = await render()
    await flushPromises()
    expect(hasCatalog()).toBe(true)

    getShopStatus.mockResolvedValue({ ...openStatus, closed: true })
    await router.push('/shop/7')
    await flushPromises()

    expect(getShopStatus).toHaveBeenCalledTimes(2)
    expect(hasCatalog()).toBe(false)
  })

  it('deja de consultar el servidor cuando se desmonta', async () => {
    await render()
    await flushPromises()
    expect(getShopStatus).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    wrapper = undefined

    await vi.advanceTimersByTimeAsync(30000)

    expect(getShopStatus).toHaveBeenCalledTimes(1)
  })
})
