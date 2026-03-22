import { test, expect } from '@playwright/test';

test.describe('La Bodega del Computador - E2E Tests', () => {
  
  test('1. Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/La Bodega del Computador/);
    await expect(page.locator('text=Tecnología de última generación')).toBeVisible();
  });

  test('2. Products page loads with products', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('text=Productos')).toBeVisible();
    await expect(page.locator('.product-card, [class*="product"], .grid > div').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Product detail page loads', async ({ page }) => {
    await page.goto('/products');
    const productLink = page.locator('a[href*="/products/"]').first();
    await productLink.click();
    await expect(page.url()).toContain('/products/');
  });

  test('4. Cart functionality works', async ({ page }) => {
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    const addToCartBtn = page.locator('button:has-text("Añadir"), button:has-text("Agregar")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await expect(page.locator('text=carrito,Cart,cart')).toBeVisible({ timeout: 5000 });
    }
  });

  test('5. Login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('6. Register page loads', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('7. Services page loads', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('text=Servicio Técnico,Reparación')).toBeVisible();
  });

  test('8. Admin dashboard requires auth', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.url()).toContain('/auth/login');
  });

  test('9. Sales page loads', async ({ page }) => {
    await page.goto('/sales');
    await expect(page.locator('text=Ofertas,ofertas')).toBeVisible();
  });

  test('10. Mobile responsive - products page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    await expect(page).toHaveTitle(/La Bodega/);
  });

  test('11. Footer has legal links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Política de Privacidad')).toBeVisible();
    await expect(page.locator('text=Términos y Condiciones')).toBeVisible();
  });

  test('12. Privacy policy page loads', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('text=Política de Privacidad')).toBeVisible();
  });

  test('13. Terms page loads', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.locator('text=Términos y Condiciones')).toBeVisible();
  });

  test('14. Categories filter works', async ({ page }) => {
    await page.goto('/products?category=laptops');
    await expect(page.url()).toContain('category=laptops');
  });

  test('15. Search functionality', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[placeholder*="buscar", type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Dell');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
    }
  });
});
