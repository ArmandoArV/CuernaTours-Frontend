import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Create Trip Bugs - Oficina Role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'oficina');
    await page.waitForTimeout(2000);
  });

  test('BUG: Trip summary title padding from left', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to create order
    const createBtn = page.locator('button:has-text("Crear"), a:has-text("Crear"), button:has-text("Nueva"), a:has-text("Nueva")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/create-trip-page.png', fullPage: true });
    
    // Check for "Resumen" section title padding
    const resumenTitle = page.locator('text=Resumen, h2:has-text("Resumen"), h3:has-text("Resumen")').first();
    if (await resumenTitle.isVisible()) {
      const paddingLeft = await resumenTitle.evaluate(el => getComputedStyle(el).paddingLeft);
      const marginLeft = await resumenTitle.evaluate(el => getComputedStyle(el).marginLeft);
      console.log(`Resumen title paddingLeft: ${paddingLeft}, marginLeft: ${marginLeft}`);
      await resumenTitle.screenshot({ path: 'tests/screenshots/resumen-title.png' });
    }
  });

  test('BUG: Unit and notes overlap check', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to create trip from an existing contract
    const createBtn = page.locator('button:has-text("Crear"), a:has-text("Crear")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Look for unit/notes section
    const unitSection = page.locator('[class*="unidad" i], [class*="unit" i], [class*="Unidad"]').first();
    const notesSection = page.locator('[class*="notas" i], [class*="notes" i], textarea[placeholder*="notas" i]').first();
    
    if (await unitSection.isVisible() && await notesSection.isVisible()) {
      const unitBox = await unitSection.boundingBox();
      const notesBox = await notesSection.boundingBox();
      
      if (unitBox && notesBox) {
        const overlap = unitBox.x + unitBox.width > notesBox.x && unitBox.y + unitBox.height > notesBox.y;
        console.log(`Unit box: x=${unitBox.x}, w=${unitBox.width}, y=${unitBox.y}, h=${unitBox.height}`);
        console.log(`Notes box: x=${notesBox.x}, w=${notesBox.width}, y=${notesBox.y}, h=${notesBox.height}`);
        console.log(`Potential overlap: ${overlap}`);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/unit-notes-layout.png', fullPage: true });
  });

  test('BUG: Stops prefill from form data', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to access an existing contract to edit trip
    const editBtns = page.locator('button:has-text("Editar"), a:has-text("Editar"), button[aria-label*="edit" i]');
    if (await editBtns.first().isVisible()) {
      await editBtns.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if stops/paradas have prefilled data
      const paradaInputs = page.locator('[class*="parada" i] input, [class*="stop" i] input');
      const count = await paradaInputs.count();
      console.log(`Parada inputs found: ${count}`);
      
      for (let i = 0; i < Math.min(count, 6); i++) {
        const value = await paradaInputs.nth(i).inputValue();
        console.log(`  Parada input ${i}: "${value}"`);
      }
      
      await page.screenshot({ path: 'tests/screenshots/stops-prefill.png', fullPage: true });
    }
  });

  test('BUG: Unit assignment prefill', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to edit an existing trip
    const editBtns = page.locator('button:has-text("Editar"), a:has-text("Editar")');
    if (await editBtns.first().isVisible()) {
      await editBtns.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check unit assignment section
      const unitSelects = page.locator('[class*="unidad" i] select, [class*="unidad" i] [role="combobox"], [class*="unit" i] select');
      const count = await unitSelects.count();
      console.log(`Unit assignment selects: ${count}`);
      
      for (let i = 0; i < Math.min(count, 4); i++) {
        const value = await unitSelects.nth(i).inputValue().catch(() => 'N/A');
        const text = await unitSelects.nth(i).textContent().catch(() => 'N/A');
        console.log(`  Unit select ${i}: value="${value}" text="${text}"`);
      }
      
      await page.screenshot({ path: 'tests/screenshots/unit-prefill.png', fullPage: true });
    }
  });
});
