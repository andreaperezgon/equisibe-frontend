import { describe, it, expect,vi } from 'vitest'
import { mount } from '@vue/test-utils'
import axios from 'axios'
import ContactForm from './ContactForm.vue'

vi.mock('axios')
describe('ContactForm', () => {
  it('renders the contact form fields', () => {
    const wrapper = mount(ContactForm)

    expect(wrapper.find('#name').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#message').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })
  it('updates the form fields with user input', async () => {
  const wrapper = mount(ContactForm)

  await wrapper.find('#name').setValue('Andrea')
  await wrapper.find('#email').setValue('andrea@email.com')
  await wrapper.find('#message').setValue('Quiero información')

  expect(wrapper.find('#name').element.value).toBe('Andrea')
  expect(wrapper.find('#email').element.value).toBe('andrea@email.com')
  expect(wrapper.find('#message').element.value).toBe('Quiero información')
})
it('sends the contact form successfully', async () => {
  axios.post.mockResolvedValue({
    data: {
      id: 1,
      name: 'Andrea',
      email: 'andrea@email.com',
      message: 'Quiero información',
    },
  })

  const wrapper = mount(ContactForm)

  await wrapper.find('#name').setValue('Andrea')
  await wrapper.find('#email').setValue('andrea@email.com')
  await wrapper.find('#message').setValue('Quiero información')

  await wrapper.find('form').trigger('submit')

  expect(axios.post).toHaveBeenCalledWith(
    'http://localhost:8080/api/contacts',
    {
      name: 'Andrea',
      email: 'andrea@email.com',
      message: 'Quiero información',
    }
  )
})
it('shows an error message when the request fails', async () => {
  axios.post.mockRejectedValue(new Error('Network Error'))

  const wrapper = mount(ContactForm)

  await wrapper.find('#name').setValue('Andrea')
  await wrapper.find('#email').setValue('andrea@email.com')
  await wrapper.find('#message').setValue('Quiero información')

  await wrapper.find('form').trigger('submit')

  expect(wrapper.text()).toContain(
    'No se ha podido enviar el mensaje.'
  )
})
it('shows success message and clears the form after submitting', async () => {
  axios.post.mockResolvedValue({
    data: {
      id: 1,
      name: 'Andrea',
      email: 'andrea@email.com',
      message: 'Quiero información',
    },
  })

  const wrapper = mount(ContactForm)

  await wrapper.find('#name').setValue('Andrea')
  await wrapper.find('#email').setValue('andrea@email.com')
  await wrapper.find('#message').setValue('Quiero información')

  await wrapper.find('form').trigger('submit')

  expect(wrapper.text()).toContain('Mensaje enviado correctamente.')

  expect(wrapper.find('#name').element.value).toBe('')
  expect(wrapper.find('#email').element.value).toBe('')
  expect(wrapper.find('#message').element.value).toBe('')
})
})