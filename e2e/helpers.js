import { randomUUID } from 'node:crypto'
import { test as base, expect } from '@playwright/test'

export { expect }
export const test = base.extend({
  isolatedBackend: [async ({ request }, use) => {
    await assertIsolated(request)
    await use()
  }, { auto: true }],
})
export const API = 'http://localhost:8080'
export const PASSWORD = 'E2eOnly!2026'
export const ADMIN = 'e2e-admin@example.test'
export const CUSTOMER_WITH_ORDER = 'e2e-customer@example.test'

export async function assertIsolated(request) {
  const response = await request.get(`${API}/api/auth/csrf`)
  expect(response.status(), 'Arranca el backend con los perfiles test,e2e').toBe(200)
  expect(response.headers()['x-equisibe-e2e'],
    'Las pruebas con cambios solo pueden usar el backend E2E de memoria').toBe('isolated-memory')
  return response.json()
}

export async function writeApi(request, method, path, data) {
  const csrf = await assertIsolated(request)
  return request.fetch(`${API}${path}`, {
    method,
    headers: { [csrf.headerName]: csrf.token },
    ...(data === undefined ? {} : { data }),
  })
}

export async function createCustomer(request) {
  const customer = { name: 'Cliente E2E', email: `e2e-${randomUUID()}@example.test`, password: PASSWORD }
  const response = await writeApi(request, 'POST', '/api/auth/register', customer)
  expect(response.status()).toBe(201)
  return customer
}

export async function login(page, email, password = PASSWORD) {
  await assertIsolated(page.request)
  await page.goto('/login')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/account$/)
}

export async function product(request, name = 'Camisa E2E') {
  await assertIsolated(request)
  const response = await request.get(`${API}/api/products`)
  expect(response.ok()).toBeTruthy()
  const item = (await response.json()).find((entry) => entry.name === name)
  expect(item, `Debe existir la prenda ficticia ${name}`).toBeTruthy()
  return item
}

export async function addShirt(page) {
  const shirt = await product(page.request)
  await page.goto(`/shop/${shirt.id}`)
  await page.getByRole('button', { name: 'S: disponible', exact: true }).click()
  await page.getByTestId('add-to-cart').click()
  await expect(page.getByRole('status').filter({ hasText: 'Prenda añadida al carrito.' })).toBeVisible()
  return shirt
}

export async function saveAddress(page) {
  await page.goto('/account/addresses')
  await page.getByRole('button', { name: 'Añadir dirección', exact: true }).click()
  await page.getByLabel('Nombre y apellidos', { exact: true }).fill('Cliente E2E')
  await page.getByLabel('Teléfono', { exact: true }).fill('600123456')
  await page.getByLabel('Calle y número', { exact: true }).fill('Calle de prueba 12')
  await page.getByLabel('Localidad', { exact: true }).fill('Oviedo')
  await page.getByLabel('Provincia', { exact: true }).fill('Asturias')
  await page.getByLabel('Código postal', { exact: true }).fill('33001')
  await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dirección guardada.' })).toBeVisible()
}


