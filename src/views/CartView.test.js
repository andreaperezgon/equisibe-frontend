import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import CartView from './CartView.vue'
import { useCartStore } from '../stores/cartStore'

const product = {
  id: 1,
  name: 'Camisa Equisibé',
  imageUrl: '/images/products/CAMISA.jpeg',
  price: 49.9,
  stockBySize: { S: 3, M: 0, L: 4, XL: 2 },
}

const mountCart = async (prepareCart = () => {}) => {
  const pinia = createPinia()
  const cart = useCartStore(pinia)

  prepareCart(cart)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cart', component: CartView },
      { path: '/shop', component: { template: '<div />' } },
      { path: '/shop/:id', component: { template: '<div />' } },
    ],
  })

  await router.push('/cart')
  await router.isReady()

  const wrapper = mount(CartView, {
    global: {
      plugins: [router, pinia],
    },
  })

  return { wrapper, cart }
}

describe('CartView', () => {
  it('shows an empty cart and a link to the shop', async () => {
    const { wrapper } = await mountCart()

    expect(wrapper.get('h1').text()).toBe('Tu carrito')
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Tu carrito está vacío.',
    )
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.get('a[href="/shop"]').exists()).toBe(true)
  })

  it('renders the product, size, quantity and subtotal', async () => {
    const { wrapper } = await mountCart((cart) => {
      cart.addItem(product, 'S')
      cart.addItem(product, 'S')
    })

    const item = wrapper.get('li')
    const summary = wrapper.get('aside')

    expect(item.text()).toContain('Camisa Equisibé')
    expect(item.text()).toContain('Talla: S')
    expect(item.text().replace(/\s/g, '')).toContain('49,90€')
    expect(item.get('[role="group"] span').text()).toBe('2')
    expect(item.get('img').attributes('src')).toBe(product.imageUrl)
    expect(item.get('a').attributes('href')).toBe('/shop/1')
    expect(summary.text().replace(/\s/g, '')).toContain('99,80€')
    expect(summary.text()).toContain('Gastos de envío no incluidos.')
  })

  it('increases quantity and updates the subtotal', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'S')
    })

    await wrapper.get(
      'button[aria-label="Aumentar cantidad de Camisa Equisibé, talla S"]',
    ).trigger('click')

    expect(cart.items[0].quantity).toBe(2)
    expect(wrapper.get('[role="group"] span').text()).toBe('2')
    expect(wrapper.get('aside').text().replace(/\s/g, '')).toContain(
      '99,80€',
    )
  })

  it('decreases quantity and updates the subtotal', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'S')
      store.addItem(product, 'S')
    })

    await wrapper.get(
      'button[aria-label="Reducir cantidad de Camisa Equisibé, talla S"]',
    ).trigger('click')

    expect(cart.items[0].quantity).toBe(1)
    expect(wrapper.get('aside').text().replace(/\s/g, '')).toContain(
      '49,90€',
    )
  })

  it('disables decreasing when quantity is one', async () => {
    const { wrapper } = await mountCart((cart) => {
      cart.addItem(product, 'S')
    })

    expect(
      wrapper.get(
        'button[aria-label="Reducir cantidad de Camisa Equisibé, talla S"]',
      ).element.disabled,
    ).toBe(true)
  })

  it('disables increasing when quantity reaches stock', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'XL')
      store.addItem(product, 'XL')
    })

    const increase = wrapper.get(
      'button[aria-label="Aumentar cantidad de Camisa Equisibé, talla XL"]',
    )

    expect(increase.element.disabled).toBe(true)

    await increase.trigger('click')

    expect(cart.items[0].quantity).toBe(2)
  })

  it('removes only the selected size', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'S')
      store.addItem(product, 'L')
    })

    await wrapper.get(
      'button[aria-label="Eliminar Camisa Equisibé, talla S"]',
    ).trigger('click')

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].size).toBe('L')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.get('li').text()).toContain('Talla: L')
  })

  it('shows the empty state after removing the last item', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'S')
    })

    await wrapper.get(
      'button[aria-label="Eliminar Camisa Equisibé, talla S"]',
    ).trigger('click')

    expect(cart.items).toHaveLength(0)
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Tu carrito está vacío.',
    )
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('clears all items', async () => {
    const { wrapper, cart } = await mountCart((store) => {
      store.addItem(product, 'S')
      store.addItem(product, 'L')
    })

    const clearButton = wrapper.findAll('button').find(
      (button) => button.text() === 'Vaciar carrito',
    )

    expect(clearButton).toBeDefined()

    await clearButton.trigger('click')

    expect(cart.items).toEqual([])
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Tu carrito está vacío.',
    )
  })

  it('displays one size as Única', async () => {
    const { wrapper } = await mountCart((cart) => {
      cart.addItem({
        ...product,
        id: 2,
        name: 'Gorra Equisibé',
        stockBySize: { TU: 5 },
      }, 'TU')
    })

    expect(wrapper.get('li').text()).toContain('Gorra Equisibé')
    expect(wrapper.get('li').text()).toContain('Talla: Única')
  })
})