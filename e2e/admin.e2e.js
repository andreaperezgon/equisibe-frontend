import { randomUUID } from 'node:crypto'
import { test, expect, API, ADMIN, CUSTOMER_WITH_ORDER, createCustomer, login, addShirt, saveAddress, writeApi } from './helpers.js'

async function scenario(page) {
  const response = await writeApi(page.request, 'POST', '/api/admin/e2e/orders', {})
  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function logout(page) {
  await page.goto('/account')
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
}

test('admin crea una prenda con imagen, stock, rebaja y cambia su visibilidad', async ({ page }) => {
  test.setTimeout(120000)
  await login(page, ADMIN)
  await page.goto('/admin/products')
  await page.getByRole('button', { name: 'Nueva prenda', exact: true }).click()
  const name = `Prenda E2E ${randomUUID().slice(0, 8)}`
  await page.getByLabel('Nombre', { exact: true }).fill(name)
  await page.getByLabel('Descripción', { exact: true }).fill('Producto ficticio creado por Playwright.')
  await page.getByLabel('Precio (€)', { exact: true }).fill('45')
  await page.getByLabel('Categoría', { exact: true }).fill('Pruebas E2E')
  await page.getByLabel('Imagen del producto', { exact: true }).setInputFiles('src/assets/header.png')
  await expect(page.getByAltText('Vista previa de la imagen del producto')).toBeVisible()
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click()
  const row = page.locator('main li').filter({ has: page.getByRole('heading', { name, exact: true }) })
  await expect(row).toBeVisible()
  await row.getByLabel(`Unidades de ${name}, talla S`, { exact: true }).fill('3')
  await row.getByLabel(`Unidades de ${name}, talla M`, { exact: true }).fill('2')
  const [stock] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/stock') && response.request().method() === 'PUT'),
    row.getByRole('button', { name: 'Guardar stock', exact: true }).click(),
  ])
  expect(stock.status()).toBe(200)
  await page.reload()
  await expect(row.getByLabel(`Unidades de ${name}, talla S`, { exact: true })).toHaveValue('3')
  await row.getByRole('button', { name: 'Rebaja', exact: true }).click()
  await row.getByLabel(`Precio rebajado de ${name}`, { exact: true }).fill('30')
  const [sale] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/sale') && response.request().method() === 'PUT'),
    row.getByRole('button', { name: 'Guardar rebaja', exact: true }).click(),
  ])
  expect(sale.status()).toBe(200)
  await expect(row.locator('del')).toContainText('45,00')
  await expect(row.locator('strong')).toContainText('30,00')
  await row.getByRole('button', { name: `Retirar ${name}`, exact: true }).click()
  await expect(row.getByRole('button', { name: `Reactivar ${name}`, exact: true })).toBeEnabled()
  await page.goto('/shop')
  await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0)
  await page.goto('/admin/products')
  await row.getByRole('button', { name: `Reactivar ${name}`, exact: true }).click()
  await expect(row.getByRole('button', { name: `Retirar ${name}`, exact: true })).toBeEnabled()
  await page.goto('/shop')
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
})

test('admin prepara, envía y entrega un pedido y el cliente ve el cambio', async ({ page }) => {
  test.setTimeout(120000)
  await login(page, ADMIN)
  const { orderId } = await scenario(page)
  await page.goto('/admin/orders')
  const order = page.getByRole('article').filter({ has: page.getByRole('heading', { name: `Pedido #${orderId}`, exact: true }) })
  await order.getByRole('button', { name: 'Marcar en preparación', exact: true }).click()
  await expect(order.getByRole('button', { name: 'Marcar enviado', exact: true })).toBeEnabled()
  await order.getByRole('button', { name: 'Marcar enviado', exact: true }).click()
  await page.getByRole('button', { name: /^Enviados \(/ }).click()
  await expect(order).toBeVisible()
  await order.getByRole('button', { name: 'Marcar entregado', exact: true }).click()
  await page.getByRole('button', { name: /^Entregados \(/ }).click()
  await expect(order).toContainText('Entregado')
  await logout(page)
  await login(page, CUSTOMER_WITH_ORDER)
  await page.goto(`/orders/${orderId}`)
  await expect(page.locator('main')).toContainText('Entregado')
})

test('admin finaliza una devolución y el cliente puede leer su respuesta', async ({ page }) => {
  test.setTimeout(120000)
  await login(page, ADMIN)
  const { orderId, returnId } = await scenario(page)
  await page.goto('/admin/returns')
  const entry = page.getByRole('article').filter({ has: page.getByRole('heading', { name: `Solicitud #${returnId}`, exact: true }) })
  for (const status of ['IN_REVIEW', 'AWAITING_ITEMS', 'RECEIVED', 'CLOSED']) {
    await entry.getByLabel('Estado', { exact: true }).selectOption(status)
    await entry.getByLabel('Respuesta para el cliente', { exact: true }).fill(`Respuesta E2E ${returnId}: ${status}`)
    const [response] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith(`/api/admin/returns/${returnId}/status`) && response.request().method() === 'PUT'),
      entry.getByRole('button', { name: 'Guardar estado y respuesta', exact: true }).click(),
    ])
    expect(response.status()).toBe(200)
    await expect(entry.getByRole('button', { name: 'Guardar estado y respuesta', exact: true })).toBeEnabled()
  }
  await expect(entry.locator(':scope > div > p')).toHaveText('Finalizada')
  await logout(page)
  await login(page, CUSTOMER_WITH_ORDER)
  await page.goto(`/orders/${orderId}`)
  await expect(page.locator('main')).toContainText(`Respuesta E2E ${returnId}: CLOSED`)
  await expect(page.locator('main')).toContainText('Finalizada')
})

test('activar y desactivar un popup habilita y bloquea su descuento', async ({ page, request, browser }) => {
  test.setTimeout(180000)
  await login(page, ADMIN)
  const customer = await createCustomer(request)
  const title = `Bienvenida E2E ${randomUUID().slice(0, 8)}`
  const buyerContext = await browser.newContext({ baseURL: 'http://localhost:5173' })
  const buyer = await buyerContext.newPage()
  let popupId
  try {
    await page.goto('/admin/popups')
    await page.getByRole('button', { name: 'Nuevo anuncio', exact: true }).click()
    await page.getByLabel('Título', { exact: true }).fill(title)
    await page.getByLabel('Texto o motivo del descuento', { exact: true }).fill('Descuento ficticio de bienvenida.')
    await page.getByRole('combobox', { name: 'Código para copiar', exact: true }).selectOption('EQUISIBE10')
    await page.getByRole('button', { name: 'Guardar anuncio', exact: true }).click()
    const popup = page.locator('main li').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    await expect(popup).toBeVisible()
    const response = await page.request.get(`${API}/api/admin/popups`)
    popupId = (await response.json()).find((item) => item.title === title).id
    await popup.getByRole('button', { name: 'Activar', exact: true }).click()
    await expect(popup.getByRole('button', { name: 'Desactivar', exact: true })).toBeEnabled()

    await login(buyer, customer.email)
    await buyer.goto('/')
    const dialog = buyer.getByRole('dialog', { name: title, exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /Cerrar/ }).click()
    await addShirt(buyer)
    await saveAddress(buyer)
    await buyer.goto('/checkout')
    await buyer.getByRole('radio').check()
    await buyer.getByLabel('Código promocional', { exact: true }).fill('EQUISIBE10')
    await buyer.getByTestId('validate-checkout').click()
    await expect(buyer.getByRole('status').filter({ hasText: 'EQUISIBE10 aplicado:' })).toBeVisible()

    await popup.getByRole('button', { name: 'Desactivar', exact: true }).click()
    await expect(popup.getByRole('button', { name: 'Activar', exact: true })).toBeEnabled()
    const [rejected] = await Promise.all([
      buyer.waitForResponse((response) => response.url().includes('/api/checkout') && response.request().method() === 'POST'),
      buyer.getByTestId('validate-checkout').click(),
    ])
    expect(rejected.status()).toBe(400)
    await expect(buyer.getByRole('alert')).toBeVisible()
    await expect(buyer.getByTestId('pay-checkout')).toHaveCount(0)
  } finally {
    if (popupId) {
      const removed = await writeApi(page.request, 'DELETE', `/api/admin/popups/${popupId}`)
      expect(removed.status()).toBe(204)
    }
    await buyerContext.close()
  }
})

for (const countdown of [false, true]) {
  test(`el cierre de tienda ${countdown ? 'con cuenta atrás' : 'solo con texto'} no se puede quitar y permite visitar Contacto`, async ({ page, browser }) => {
    test.setTimeout(120000)
    await login(page, ADMIN)
    const visitorContext = await browser.newContext({ baseURL: 'http://localhost:5173' })
    const visitor = await visitorContext.newPage()
    try {
      await page.goto('/admin/popups')
      await page.getByLabel('Mantener Tienda cerrada', { exact: true }).check()
      await page.getByLabel('Título del aviso', { exact: true }).fill('Tienda cerrada E2E')
      await page.getByLabel('Texto del aviso', { exact: true }).fill('Estamos preparando la colección de prueba.')
      await page.getByLabel('Mostrar cuenta atrás', { exact: true }).setChecked(countdown)
      if (countdown) {
        await page.getByLabel('Fecha y hora de la cuenta atrás', { exact: true })
          .fill(new Date(Date.now() - 86400000).toISOString().slice(0, 16))
      }
      const [saved] = await Promise.all([
        page.waitForResponse((response) => response.url().endsWith('/api/admin/shop/settings') && response.request().method() === 'PUT'),
        page.getByRole('button', { name: 'Guardar configuración de Tienda', exact: true }).click(),
      ])
      expect(saved.status()).toBe(200)
      await visitor.goto('/shop')
      await expect(visitor.getByRole('heading', { name: 'Tienda cerrada E2E', exact: true })).toBeVisible()
      await expect(visitor.locator('main').getByRole('button', { name: /Cerrar/ })).toHaveCount(0)
      await expect(visitor.getByLabel('Filtrar por categoría', { exact: true })).toHaveCount(0)
      await expect(visitor.getByRole('timer')).toHaveCount(countdown ? 1 : 0)
      await visitor.goto('/contact')
      await expect(visitor).toHaveURL(/\/contact$/)
      await expect(visitor.locator('main form')).toBeVisible()
      await visitor.goto('/shop')
      await expect(visitor.getByRole('heading', { name: 'Tienda cerrada E2E', exact: true })).toBeVisible()
    } finally {
      const reopened = await writeApi(page.request, 'PUT', '/api/admin/shop/settings', {
        closed: false, title: 'Tienda abierta', text: 'Colección de prueba disponible.',
        countdownEnabled: false, countdownTarget: null,
      })
      expect(reopened.ok()).toBeTruthy()
      await visitorContext.close()
    }
  })
}
