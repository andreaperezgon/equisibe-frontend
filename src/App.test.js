import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'

const { auth } = vi.hoisted(() => ({
  auth: { fetchCurrentUser: vi.fn() },
}))

vi.mock('./stores/authStore', () => ({
  useAuthStore: () => auth,
}))

let wrapper

beforeEach(() => {
  vi.resetAllMocks()
  auth.fetchCurrentUser.mockResolvedValue(undefined)
})

afterEach(() => {
  wrapper?.unmount()
})

async function render(path = '/', gateOpen = true) {
  const page = { template: '<main data-testid="page">Contenido de la página</main>' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/shop', component: page },
      { path: '/shop/:id', component: page },
      { path: '/checkout', component: page },
      { path: '/account', component: page },
      { path: '/contact', component: page },
      { path: '/cart', component: page },
    ],
  })

  await router.push(path)
  await router.isReady()

  wrapper = mount(App, {
    global: {
      plugins: [router],
      stubs: {
        AppHeader: { template: '<header>Cabecera</header>' },
        AppFooter: { template: '<footer>Pie de página</footer>' },
        PromotionalPopup: {
          template: '<aside data-testid="promotion">Promoción</aside>',
        },
        ShopAccessGate: {
          template: gateOpen
            ? '<section data-testid="gate"><slot /></section>'
            : '<section data-testid="gate">Tienda cerrada</section>',
        },
      },
    },
  })

  await flushPromises()
  return router
}

describe('App', () => {
  it.each([
    ['/', false, true],
    ['/shop', true, true],
    ['/shop/7', true, false],
    ['/checkout', true, false],
    ['/account', false, false],
    ['/contact', false, false],
    ['/cart', false, false],
  ])(
    'integra cierre y promociones en %s',
    async (path, restricted, promotion) => {
      await render(path)

      expect(wrapper.find('[data-testid="gate"]').exists()).toBe(restricted)
      expect(wrapper.find('[data-testid="promotion"]').exists()).toBe(promotion)
      expect(wrapper.find('[data-testid="page"]').exists()).toBe(true)
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.find('footer').exists()).toBe(true)
      expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
    }
  )

  it.each(['/shop', '/checkout'])(
    'oculta el contenido de %s cuando el cierre bloquea el acceso',
    async (path) => {
      await render(path, false)

      expect(wrapper.text()).toContain('Tienda cerrada')
      expect(wrapper.find('[data-testid="page"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="promotion"]').exists()).toBe(false)
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.find('footer').exists()).toBe(true)
    }
  )

  it('mantiene Inicio disponible aunque Tienda esté cerrada', async () => {
    await render('/', false)

    expect(wrapper.find('[data-testid="gate"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="page"]').exists()).toBe(true)
  })

  it('informa del fallo al comprobar la sesión sin ocultar la web pública', async () => {
    auth.fetchCurrentUser.mockRejectedValue(new Error('Sin conexión'))
    await render('/')

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo comprobar la sesión'
    )
    expect(wrapper.find('[data-testid="page"]').exists()).toBe(true)
  })

  it('actualiza el cierre y el popup al cambiar de página', async () => {
    const router = await render('/')
    expect(wrapper.find('[data-testid="promotion"]').exists()).toBe(true)

    await router.push('/shop')
    await flushPromises()

    expect(wrapper.find('[data-testid="gate"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="promotion"]').exists()).toBe(true)

    await router.push('/contact')
    await flushPromises()

    expect(wrapper.find('[data-testid="gate"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="promotion"]').exists()).toBe(false)
    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
  })
})
