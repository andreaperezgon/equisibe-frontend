import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeGallery from './HomeGallery.vue'
import { homeGalleryImages } from '../../data/homeGalleryImages'

let wrapper
const render = () => {
  wrapper = mount(HomeGallery, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  return wrapper
}
afterEach(() => wrapper?.unmount())

describe('HomeGallery', () => {
  it('muestra las fotos y mantiene el título de la sección', () => {
    render()
    expect(wrapper.text()).toContain('Hecho a mano, pieza a pieza')
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[0].src)
    expect(wrapper.get('img').attributes('alt')).toBe(homeGalleryImages[0].alt)
    expect(wrapper.get('[role="status"]').text()).toContain('1 / ' + homeGalleryImages.length)
  })
  it('avanza y vuelve al principio tras la última foto', async () => {
    render()
    const next = wrapper.get('[aria-label="Ver fotografía siguiente"]')
    for (let i = 0; i < homeGalleryImages.length; i += 1) await next.trigger('click')
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[0].src)
  })
  it('permite retroceder de la primera a la última foto', async () => {
    render()
    await wrapper.get('[aria-label="Ver fotografía anterior"]').trigger('click')
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages.at(-1).src)
  })
  it('permite navegar con el teclado', async () => {
    render()
    await wrapper.get('section').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[1].src)
    await wrapper.get('section').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[0].src)
  })
  it('permite deslizar horizontalmente en una pantalla táctil', async () => {
    render()
    const grid = wrapper.get('.gallery-grid')
    await grid.trigger('touchstart', { touches: [{ clientX: 250, clientY: 100 }] })
    await grid.trigger('touchend', { changedTouches: [{ clientX: 80, clientY: 110 }] })
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[1].src)
  })
  it('no cambia de foto al desplazar verticalmente', async () => {
    render()
    const grid = wrapper.get('.gallery-grid')
    await grid.trigger('touchstart', { touches: [{ clientX: 250, clientY: 100 }] })
    await grid.trigger('touchend', { changedTouches: [{ clientX: 260, clientY: 260 }] })
    expect(wrapper.get('img').attributes('src')).toBe(homeGalleryImages[0].src)
  })
})