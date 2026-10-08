import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import axios from 'axios'
import ContactForm from './ContactForm.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const fillForm = async (wrapper) => {
  await wrapper.get('#name').setValue('Andrea')
  await wrapper.get('#email').setValue('andrea@email.com')
  await wrapper.get('#message').setValue('Quiero información')
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    axios.get.mockResolvedValue({
      data: {
        headerName: 'X-CSRF-TOKEN',
        token: 'test-csrf-token',
      },
    })

    axios.post.mockResolvedValue({ data: { id: 1 } })
  })

  it('renders the contact form fields', () => {
    const wrapper = mount(ContactForm)

    expect(wrapper.find('#name').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#message').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('updates the form fields with user input', async () => {
    const wrapper = mount(ContactForm)

    await fillForm(wrapper)

    expect(wrapper.get('#name').element.value).toBe('Andrea')
    expect(wrapper.get('#email').element.value).toBe('andrea@email.com')
    expect(wrapper.get('#message').element.value).toBe('Quiero información')
  })

  it('sends the contact message with the CSRF token and session cookie', async () => {
    const wrapper = mount(ContactForm)

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(axios.get).toHaveBeenCalledExactlyOnceWith(
      'http://localhost:8080/api/auth/csrf',
      { withCredentials: true },
    )

    expect(axios.post).toHaveBeenCalledExactlyOnceWith(
      'http://localhost:8080/api/contacts',
      {
        name: 'Andrea',
        email: 'andrea@email.com',
        message: 'Quiero información',
      },
      {
        withCredentials: true,
        headers: {
          'X-CSRF-TOKEN': 'test-csrf-token',
        },
      },
    )
  })

  it('shows an error and preserves the fields when sending fails', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))

    const wrapper = mount(ContactForm)

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se ha podido enviar el mensaje.',
    )
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('#message').element.value).toBe('Quiero información')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })

  it('shows success and clears the form after submitting', async () => {
    const wrapper = mount(ContactForm)

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe(
      'Mensaje enviado correctamente.',
    )
    expect(wrapper.get('#name').element.value).toBe('')
    expect(wrapper.get('#email').element.value).toBe('')
    expect(wrapper.get('#message').element.value).toBe('')
  })

  it('does not send the message when fetching the CSRF token fails', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'))

    const wrapper = mount(ContactForm)

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(axios.post).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se ha podido enviar el mensaje.',
    )
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })

  it('prevents duplicate submissions while the request is pending', async () => {
    let resolveRequest

    axios.post.mockImplementation(
      () => new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const wrapper = mount(ContactForm)

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)

    await wrapper.get('form').trigger('submit')

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledTimes(1)

    resolveRequest({ data: { id: 1 } })
    await flushPromises()

    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Mensaje enviado correctamente.',
    )
  })
})