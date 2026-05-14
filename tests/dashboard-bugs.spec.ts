import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard Bugs - Oficina Role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'oficina');
  });

  test('BUG: Status "en curso" animation - should verify pulse effect', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for status badges/chips
    const statusElements = page.locator('[class*="status"], [class*="Status"], [class*="badge"], [class*="chip"]');
    const count = await statusElements.count();
    console.log(`Found ${count} status elements`);
    
    // Take screenshot of dashboard for visual inspection
    await page.screenshot({ path: 'tests/screenshots/dashboard-statuses.png', fullPage: true });
    
    // Check for pulse animation class
    const pulseElements = page.locator('[class*="pulse"], .status-pulse');
    const pulseCount = await pulseElements.count();
    console.log(`Elements with pulse animation: ${pulseCount}`);
  });

  test('BUG: Action buttons eye icon shadow', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find action buttons (eye/view icons)
    const actionButtons = page.locator('[class*="action"] button, [class*="Action"] button, button[aria-label*="ver" i], button[aria-label*="view" i]');
    const count = await actionButtons.count();
    console.log(`Found ${count} action buttons`);
    
    if (count > 0) {
      const btn = actionButtons.first();
      const boxShadow = await btn.evaluate(el => getComputedStyle(el).boxShadow);
      console.log(`Action button box-shadow: "${boxShadow}"`);
      await page.screenshot({ path: 'tests/screenshots/action-buttons.png' });
    }
  });

  test('BUG: Null fields should show --- not null', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for literal "null" text in the page
    const nullTexts = page.locator('td:has-text("null"), span:has-text("null"), div:has-text("null"), p:has-text("null")');
    const count = await nullTexts.count();
    
    // Filter for exact "null" matches (not "nullable" etc.)
    let nullCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await nullTexts.nth(i).textContent();
      if (text?.trim() === 'null' || text?.includes(' null ') || text?.endsWith(' null') || text?.startsWith('null ')) {
        nullCount++;
        console.log(`Found "null" text: "${text?.trim()}" in element`);
      }
    }
    console.log(`Total elements with literal "null": ${nullCount}`);
    await page.screenshot({ path: 'tests/screenshots/null-fields.png', fullPage: true });
  });

  test('BUG: Filters alignment check', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot the filter area
    const filterArea = page.locator('[class*="filter" i], [class*="Filter"]').first();
    if (await filterArea.isVisible()) {
      await filterArea.screenshot({ path: 'tests/screenshots/filters-alignment.png' });
      
      // Check computed gap/spacing
      const gap = await filterArea.evaluate(el => getComputedStyle(el).gap);
      console.log(`Filter area gap: ${gap}`);
    }
    await page.screenshot({ path: 'tests/screenshots/dashboard-filters.png', fullPage: false });
  });

  test('BUG: Filter clear should reset select text', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to interact with a filter dropdown
    const filterDropdowns = page.locator('[class*="filter" i] select, [class*="filter" i] [role="combobox"], [class*="Filter"] button[role="combobox"]');
    const count = await filterDropdowns.count();
    console.log(`Found ${count} filter dropdowns`);
    
    if (count > 0) {
      // Click first filter to open it
      await filterDropdowns.first().click();
      await page.waitForTimeout(500);
      
      // Select an option
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        const optionText = await option.textContent();
        console.log(`Selecting filter option: "${optionText}"`);
        await option.click();
        await page.waitForTimeout(1000);
      }
      
      // Now look for clear/reset button
      const clearBtn = page.locator('button:has-text("Limpiar"), button:has-text("Borrar"), button:has-text("Reset"), [class*="clear" i] button, button[aria-label*="clear" i]');
      if (await clearBtn.first().isVisible()) {
        await clearBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Check if dropdown text is cleared
        await page.screenshot({ path: 'tests/screenshots/filter-after-clear.png' });
        const filterText = await filterDropdowns.first().textContent();
        console.log(`Filter text after clear: "${filterText}"`);
      }
    }
  });

  test('BUG: Pay driver button disabled without driver', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/dashboard-pay-driver.png', fullPage: true });
    
    // Look for contracts without driver assigned
    const rows = page.locator('tr, [class*="card" i][class*="contract" i]');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} contract rows/cards`);
    
    // Check for "Sin asignar" or "---" in driver column, and if pay button is available
    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text?.includes('Sin asignar') || text?.includes('---')) {
        console.log(`Row ${i} has no driver. Checking pay button...`);
        const payBtn = row.locator('button:has-text("Pagar"), [class*="pay" i], button[aria-label*="pagar" i]');
        if (await payBtn.count() > 0) {
          const isDisabled = await payBtn.first().isDisabled();
          console.log(`Pay button disabled: ${isDisabled} (should be true)`);
        }
      }
    }
  });

  test('BUG: Payment amount zero should disable button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Find a contract row and try to open payment modal
    // First find the menu/action button
    const menuButtons = page.locator('[class*="action"] button, button[aria-label*="opciones" i], button[aria-label*="menu" i]').first();
    if (await menuButtons.isVisible()) {
      await menuButtons.click();
      await page.waitForTimeout(500);
      
      // Look for "Pagar" option in menu
      const payOption = page.locator('[role="menuitem"]:has-text("Pagar"), [role="option"]:has-text("Pagar")');
      if (await payOption.first().isVisible()) {
        await payOption.first().click();
        await page.waitForTimeout(1000);
        
        // Check if the payment modal opened
        await page.screenshot({ path: 'tests/screenshots/payment-modal-zero.png' });
        
        // Find the amount input and set to 0
        const amountInput = page.locator('input[type="number"], input[placeholder*="monto" i]').first();
        if (await amountInput.isVisible()) {
          await amountInput.fill('0');
          await page.waitForTimeout(500);
          
          // Check submit button state
          const submitBtn = page.locator('button:has-text("Guardar"), button:has-text("Pagar"), button[type="submit"]').first();
          const isDisabled = await submitBtn.isDisabled();
          console.log(`Submit button disabled with $0: ${isDisabled} (should be true)`);
        }
      }
    }
  });

  test('BUG: Negative payment amount should be prevented', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Similar flow - open payment modal
    const menuButtons = page.locator('[class*="action"] button').first();
    if (await menuButtons.isVisible()) {
      await menuButtons.click();
      await page.waitForTimeout(500);
      
      const payOption = page.locator('[role="menuitem"]:has-text("Pagar")');
      if (await payOption.first().isVisible()) {
        await payOption.first().click();
        await page.waitForTimeout(1000);
        
        const amountInput = page.locator('input[type="number"], input[placeholder*="monto" i]').first();
        if (await amountInput.isVisible()) {
          await amountInput.fill('-100');
          await page.waitForTimeout(500);
          const value = await amountInput.inputValue();
          console.log(`Amount input value after typing -100: "${value}" (should not be negative)`);
          await page.screenshot({ path: 'tests/screenshots/payment-negative.png' });
        }
      }
    }
  });
});
