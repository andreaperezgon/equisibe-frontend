import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AdminSectionNav from './AdminSectionNav.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
})

const links = [
  ['/account', 'Mi panel'],
  ['/admin/orders', 'Pedidos'],
  ['/admin/products', 'Productos'],
  ['/admin/popups', 'Popups y tienda'],
  ['/admin/returns', 'Devoluciones'],
]

describe('AdminSectionNav', () => {
  it.each(links)(
    'permite navegar a %s y señala la sección seleccionada',
    async (path, label) => {
      const page = { template: '<div />' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: links.map(([path]) => ({ path, component: page })),
      })
      await router.push('/account')
      await router.isReady()

      wrapper = mount(AdminSectionNav, {
        global: { plugins: [router] },
      })

      expect(wrapper.get('nav').attributes('aria-label')).toBe(
        'Secciones de administración'
      )
      expect(wrapper.findAll('a')).toHaveLength(5)

      const link = wrapper.get(`a[href="${path}"]`)
      expect(link.text()).toBe(label)

      await link.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe(path)
      expect(link.classes()).toContain('selected')
      expect(link.attributes('aria-current')).toBe('page')
      expect(wrapper.findAll('a.selected')).toHaveLength(1)
    }
  )
})
