import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProductCard from './ProductCard.vue'

const product = {
  id: 1,
  name: 'Camisa blanca',
  price: 49.9,
  imageUrl: '/images/white-shirt.jpg',
  category: 'Camisas',
  stockBySize: {
    S: 3,
    M: 0,
    L: 2,
    XL: 0,
  },
}

const mountCard = async (overrides = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/shop/:id', component: { template: '<div />' } },
    ],
  })

  await router.push('/')

  return mount(ProductCard, {
    props: {
      product: { ...product, ...overrides },
    },
    global: {
      plugins: [router],
    },
  })
}

describe('ProductCard', () => {
  it('renders the product information and detail link', async () => {
    const wrapper = await mountCard()

    expect(wrapper.get('h2').text()).toBe('Camisa blanca')
    expect(wrapper.text()).toContain('Camisas')
    expect(wrapper.text().replace(/\s/g, '')).toContain('49,90€')
    expect(wrapper.get('a').attributes('href')).toBe('/shop/1')
    expect(wrapper.get('img').attributes('alt')).toBe('Camisa blanca')
  })

  it('shows all four sizes with their availability', async () => {
    const wrapper = await mountCard()

    expect(wrapper.findAll('li').map((item) => item.text())).toEqual([
      'S',
      'M',
      'L',
      'XL',
    ])

    expect(wrapper.get('li[aria-label="S: disponible"]').exists()).toBe(true)
    expect(wrapper.get('li[aria-label="L: disponible"]').exists()).toBe(true)

    expect(
      wrapper.get('li[aria-label="M: agotada"]').classes(),
    ).toContain('line-through')

    expect(
      wrapper.get('li[aria-label="XL: agotada"]').classes(),
    ).toContain('text-black/30')

    expect(
      wrapper.get('li[aria-label="S: disponible"]').classes(),
    ).not.toContain('line-through')
  })

  it('treats sizes without stock information as unavailable', async () => {
    const wrapper = await mountCard({ stockBySize: {} })

    expect(wrapper.findAll('li[aria-label$="agotada"]')).toHaveLength(4)
  })

  it('shows a fallback when the product image fails to load', async () => {
    const wrapper = await mountCard()

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Imagen no disponible')
  })
})