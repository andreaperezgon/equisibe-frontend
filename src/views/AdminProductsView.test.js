import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import AdminProductsView from './AdminProductsView.vue'
import * as api from '../services/adminProductService'

const { auth } = vi.hoisted(() => ({
  auth: { user: { role: 'ADMIN' } },
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => auth,
}))

vi.mock('../services/adminProductService', () => ({
  getAdminProducts: vi.fn(),
  createAdminProduct: vi.fn(),
  updateAdminProduct: vi.fn(),
  setAdminProductActive: vi.fn(),
  updateAdminProductStock: vi.fn(),
  updateAdminProductSale: vi.fn(),
}))

let wrapper

const original = {
  id: 7,
  name: 'Camisa',
  description: 'Camisa artesanal',
  price: 40,
  category: 'Camisas',
  imageUrl: '/images/products/CAMISA.jpeg',
  active: true,
  salePrice: null,
  stockBySize: { S: 5, M: 4 },
}

const payload = {
  name: 'Camisa nueva',
  description: 'Algodón',
  price: 45,
  category: 'Camisas',
  imageUrl: '/images/products/CAMISA.jpeg',
}

function stub(name, events) {
  return {
    name,
    props: ['product', 'disabled'],
    emits: events,
    template: '<div />',
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.user = { role: 'ADMIN' }
  api.getAdminProducts.mockResolvedValue([{ ...original }])
})

afterEach(() => {
  wrapper?.unmount()
})

function render() {
  wrapper = mount(AdminProductsView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        AdminSectionNav: true,
        AdminProductForm: stub('AdminProductForm', ['save', 'cancel']),
        AdminProductStock: stub('AdminProductStock', ['save']),
        AdminProductSale: stub('AdminProductSale', ['save']),
      },
    },
  })
  return wrapper
}

function button(text) {
  const result = wrapper.findAll('button').find(item => item.text() === text)
  if (!result) throw new Error(`No se encontró el botón: ${text}`)
  return result
}

function child(name) {
  return wrapper.getComponent({ name })
}

async function emit(name, event, value) {
  child(name).vm.$emit(event, value)
  await flushPromises()
}

describe('AdminProductsView', () => {
  it.each([null, { role: 'CUSTOMER' }])(
    'no carga productos sin permisos de administrador: %j',
    async (user) => {
      auth.user = user
      render()
      await flushPromises()

      expect(api.getAdminProducts).not.toHaveBeenCalled()
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Necesitas permisos de administrador'
      )
      expect(wrapper.findAll('button')).toHaveLength(0)
    }
  )

  it('muestra la carga y bloquea las acciones mientras espera', async () => {
    let finish
    api.getAdminProducts.mockReturnValue(
      new Promise(resolve => { finish = resolve })
    )
    render()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Cargando productos')
    expect(button('Nueva prenda').attributes('disabled')).toBeDefined()

    finish([])
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay productos')
    expect(button('Nueva prenda').attributes('disabled')).toBeUndefined()
  })

  it('muestra los productos y pasa sus datos a los editores', async () => {
    render()
    await flushPromises()

    expect(wrapper.get('h2').text()).toBe('Camisa')
    expect(wrapper.text()).toContain('Activo en la tienda')
    expect(child('AdminProductStock').props('product').stockBySize).toEqual({
      S: 5, M: 4,
    })
    expect(child('AdminProductSale').props('product').price).toBe(40)
  })

  it('abre un formulario vacío y permite cancelarlo', async () => {
    render()
    await flushPromises()
    await button('Nueva prenda').trigger('click')

    expect(child('AdminProductForm').props('product')).toBeNull()
    await emit('AdminProductForm', 'cancel')

    expect(wrapper.findComponent({ name: 'AdminProductForm' }).exists()).toBe(false)
    expect(api.createAdminProduct).not.toHaveBeenCalled()
  })

  it('crea una prenda y la añade a la lista', async () => {
    api.createAdminProduct.mockResolvedValue({
      ...original, ...payload, id: 8, stockBySize: { S: 0 },
    })
    render()
    await flushPromises()
    await button('Nueva prenda').trigger('click')
    await emit('AdminProductForm', 'save', payload)

    expect(api.createAdminProduct).toHaveBeenCalledWith(payload)
    expect(api.updateAdminProduct).not.toHaveBeenCalled()
    expect(wrapper.findAll('h2').map(item => item.text())).toEqual([
      'Camisa nueva', 'Camisa',
    ])
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Producto creado. Su stock inicial es cero'
    )
    expect(wrapper.findComponent({ name: 'AdminProductForm' }).exists()).toBe(false)
  })

  it('edita una prenda existente sin duplicarla', async () => {
    api.updateAdminProduct.mockResolvedValue({
      ...original, ...payload,
    })
    render()
    await flushPromises()
    await button('Editar').trigger('click')

    expect(child('AdminProductForm').props('product').id).toBe(7)
    await emit('AdminProductForm', 'save', payload)

    expect(api.updateAdminProduct).toHaveBeenCalledWith(7, payload)
    expect(api.createAdminProduct).not.toHaveBeenCalled()
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(wrapper.get('h2').text()).toBe('Camisa nueva')
    expect(wrapper.get('[role="status"]').text()).toContain('Producto actualizado')
  })

  it.each([
    [true, false, 'Retirar', 'Producto retirado'],
    [false, true, 'Reactivar', 'Producto reactivado'],
  ])(
    'cambia la disponibilidad de %s a %s',
    async (active, next, action, message) => {
      api.getAdminProducts.mockResolvedValue([{ ...original, active }])
      api.setAdminProductActive.mockResolvedValue({
        ...original, active: next,
      })
      render()
      await flushPromises()
      await button(action).trigger('click')
      await flushPromises()

      expect(api.setAdminProductActive).toHaveBeenCalledWith(7, next)
      expect(wrapper.get('[role="status"]').text()).toContain(message)
      expect(button(next ? 'Retirar' : 'Reactivar').exists()).toBe(true)
    }
  )

  it('guarda el stock y actualiza los datos del editor', async () => {
    const stockBySize = { S: 0, M: 9 }
    api.updateAdminProductStock.mockResolvedValue({
      ...original, stockBySize,
    })
    render()
    await flushPromises()
    await emit('AdminProductStock', 'save', { productId: 7, stockBySize })

    expect(api.updateAdminProductStock).toHaveBeenCalledWith(7, stockBySize)
    expect(child('AdminProductStock').props('product').stockBySize).toEqual(stockBySize)
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Stock de Camisa actualizado'
    )
  })

  it.each([
    [25, 'Rebaja guardada'],
    [null, 'Rebaja quitada'],
  ])('guarda el precio rebajado %s', async (salePrice, message) => {
    api.updateAdminProductSale.mockResolvedValue({
      ...original, salePrice,
    })
    render()
    await flushPromises()
    await emit('AdminProductSale', 'save', { productId: 7, salePrice })

    expect(api.updateAdminProductSale).toHaveBeenCalledWith(7, salePrice)
    expect(child('AdminProductSale').props('product').salePrice).toBe(salePrice)
    expect(wrapper.get('[role="status"]').text()).toContain(message)
  })

  it.each([
    [401, 'cuenta administradora'],
    [403, 'cuenta administradora'],
    [400, 'Revisa los campos'],
    [404, 'El producto no está disponible'],
    [500, 'No se pudo completar la operación'],
  ])('explica una carga fallida con respuesta %s', async (status, message) => {
    api.getAdminProducts.mockRejectedValue({ response: { status } })
    render()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(message)
    expect(wrapper.findAll('h2')).toHaveLength(0)
  })

  it('permite reintentar después de un fallo de red', async () => {
    api.getAdminProducts.mockRejectedValueOnce(new Error('Sin conexión'))
    render()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    api.getAdminProducts.mockResolvedValueOnce([original])
    await button('Actualizar productos').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h2').text()).toBe('Camisa')
  })

  it('explica las cantidades rechazadas al guardar stock', async () => {
    api.updateAdminProductStock.mockRejectedValue({
      response: { status: 400 },
    })
    render()
    await flushPromises()
    await emit('AdminProductStock', 'save', {
      productId: 7, stockBySize: { S: -1 },
    })

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Revisa las unidades de cada talla'
    )
    expect(child('AdminProductStock').props('product').stockBySize.S).toBe(5)
  })

  it('explica una rebaja rechazada y conserva el precio anterior', async () => {
    api.updateAdminProductSale.mockRejectedValue({
      response: { status: 400 },
    })
    render()
    await flushPromises()
    await emit('AdminProductSale', 'save', { productId: 7, salePrice: 99 })

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'menor que el precio habitual'
    )
    expect(child('AdminProductSale').props('product').salePrice).toBeNull()
  })
})
