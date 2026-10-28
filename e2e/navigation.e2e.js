import { test, expect } from '@playwright/test'

test.beforeAll(async ({ request }) => {
  const response = await request.get(
    'http://localhost:8080/api/auth/csrf',
    { timeout: 30000 }
  )
  expect(
    response.status(),
    'El backend debe estar funcionando en localhost:8080'
  ).toBe(200)
})

test('Inicio muestra la presentación de Equisibé', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page).toHaveTitle('Equisibé')
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Ropa hecha desde cero, a la medida de quien la lleva',
  })).toBeVisible()
  await expect(page.locator('header')).toBeVisible()
  await expect(page.locator('footer')).toBeAttached()
})

test('la política de privacidad es accesible desde el footer', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' })
  await page.locator('footer').getByRole('link', {
    name: 'Política de privacidad',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.getByRole('heading', {
    level: 1, name: 'Política de privacidad',
  })).toBeVisible()
  const emailLinks = page.getByRole('link', {
    name: 'equisibe@gmail.com', exact: true,
  })
  await expect(emailLinks.first()).toBeVisible()
  for (const emailLink of await emailLinks.all()) {
    await expect(emailLink).toHaveAttribute('href', 'mailto:equisibe@gmail.com')
  }
})

test('la política de devoluciones es accesible desde el footer', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' })
  await page.locator('footer').getByRole('link', {
    name: 'Devoluciones', exact: true,
  }).click()

  await expect(page).toHaveURL(/\/returns$/)
  await expect(page.getByRole('heading', {
    level: 1, name: 'Política de devoluciones',
  })).toBeVisible()
  await expect(page.getByRole('link', {
    name: 'Ir a mis pedidos',
  })).toHaveAttribute('href', '/account')
})

test('permite cambiar entre login y registro', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  const switcher = page.getByRole('navigation', {
    name: 'Acceso a tu cuenta',
  })

  await expect(page.getByRole('heading', {
    level: 1, name: 'Qué bien verte de nuevo',
  })).toBeVisible()
  await expect(page.getByRole('link', {
    name: 'Continuar con Google', exact: true,
  })).toHaveAttribute(
    'href',
    'http://localhost:8080/oauth2/authorization/google'
  )

  await switcher.getByRole('link', {
    name: 'Crear cuenta', exact: true,
  }).click()

  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', {
    level: 1, name: 'Tu espacio empieza aquí',
  })).toBeVisible()
  await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible()

  await switcher.getByRole('link', {
    name: 'Iniciar sesión', exact: true,
  }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', {
    name: 'Iniciar sesión', exact: true,
  })).toBeVisible()
})

for (const path of ['/account', '/admin/products']) {
  test(`sin sesión, ${path} redirige al login`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', {
      level: 1, name: 'Qué bien verte de nuevo',
    })).toBeVisible()
  })
}
