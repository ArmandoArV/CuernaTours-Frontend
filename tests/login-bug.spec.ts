import { test, expect } from '@playwright/test';

test('Login flow - success modal should not get stuck', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill login form
  const emailInput = page.locator('input[name="email"]').first();
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill('armando.arredondo.valle@gmail.com');

  const passwordInput = page.locator('input[name="password"]').first();
  await passwordInput.fill('cuernatours');

  // Submit
  const loginBtn = page.locator('button[type="submit"]').first();
  await loginBtn.click();

  // Wait for SweetAlert2 success modal
  const swalModal = page.locator('.swal2-popup');
  await swalModal.waitFor({ timeout: 10000 });
  
  // Verify it's a success modal
  const title = await page.locator('.swal2-title').textContent();
  console.log(`Swal title: "${title}"`);
  expect(title).toContain('exitoso');

  await page.screenshot({ path: 'tests/screenshots/login-success-modal.png' });

  // Click OK button
  const okBtn = page.locator('.swal2-confirm');
  await okBtn.click();
  
  // Wait and verify we navigated to dashboard (modal should not be stuck)
  await page.waitForTimeout(3000);
  
  const swalStillVisible = await swalModal.isVisible().catch(() => false);
  console.log(`Swal still visible after OK: ${swalStillVisible} (should be false)`);
  
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  
  await page.screenshot({ path: 'tests/screenshots/login-after-ok.png' });
  
  expect(swalStillVisible).toBe(false);
  expect(currentUrl).toContain('/dashboard');
});
