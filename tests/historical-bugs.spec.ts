import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Historical & Commission Bugs - Oficina Role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'oficina');
  });

  test('BUG: Historical - company/client not rendering', async ({ page }) => {
    // Navigate to historical/completed contracts
    const historicalLink = page.locator('a[href*="histori"], nav >> text=Histori, [class*="nav"] >> text=Histori').first();
    if (await historicalLink.isVisible()) {
      await historicalLink.click();
    } else {
      await page.goto('/dashboard');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/screenshots/historical-page.png', fullPage: true });
    
    // Check table for "Empresa o Cliente" column
    const headers = page.locator('th, [class*="header" i]');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) {
      const text = await headers.nth(i).textContent();
      if (text?.includes('Empresa') || text?.includes('Cliente')) {
        console.log(`Found header: "${text}" at index ${i}`);
      }
    }
    
    // Check for empty cells or "---" in client column
    const cells = page.locator('td, [class*="cell"]');
    const cellCount = await cells.count();
    let emptyClientCells = 0;
    for (let i = 0; i < cellCount; i++) {
      const text = await cells.nth(i).textContent();
      if (text?.trim() === '---' || text?.trim() === '—' || text?.trim() === '') {
        emptyClientCells++;
      }
    }
    console.log(`Empty/placeholder cells: ${emptyClientCells}`);
  });

  test('BUG: Historical - driver not rendering in table', async ({ page }) => {
    const historicalLink = page.locator('a[href*="histori"], nav >> text=Histori').first();
    if (await historicalLink.isVisible()) {
      await historicalLink.click();
    } else {
      await page.goto('/dashboard');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for Chofer column
    const choferHeader = page.locator('th:has-text("Chofer"), [class*="header"]:has-text("Chofer")');
    const hasChoferColumn = await choferHeader.count() > 0;
    console.log(`Chofer column exists: ${hasChoferColumn}`);
    
    if (hasChoferColumn) {
      // Check if chofer cells have content
      await page.screenshot({ path: 'tests/screenshots/historical-driver.png', fullPage: true });
    }
  });

  test('BUG: Commission name appears double', async ({ page }) => {
    // Navigate to create order or contract details where commission is shown
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for commission-related text
    const commissionText = page.locator('text=comisión, text=Comisión, text=comision');
    const count = await commissionText.count();
    console.log(`Found ${count} elements mentioning comisión`);
    
    // Try navigating to create order to check commission field
    const createBtn = page.locator('button:has-text("Crear"), a:has-text("Crear"), button:has-text("Nueva"), a:has-text("Nueva")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for duplicate commission name labels
      const commissionLabels = page.locator('label:has-text("comisión"), label:has-text("Comisión")');
      const labelCount = await commissionLabels.count();
      console.log(`Commission labels found: ${labelCount}`);
      for (let i = 0; i < labelCount; i++) {
        const text = await commissionLabels.nth(i).textContent();
        console.log(`  Label ${i}: "${text}"`);
      }
      await page.screenshot({ path: 'tests/screenshots/commission-name.png', fullPage: true });
    }
  });
});
