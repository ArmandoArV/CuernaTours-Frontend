import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Driver/Gastos Bugs - Chofer Role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'chofer');
    await page.waitForTimeout(2000);
  });

  test('BUG: Driver dashboard - click on row does not open details', async ({ page }) => {
    // Should be on driver dashboard after login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/driver-dashboard.png', fullPage: true });
    
    // Find trip cards or table rows
    const tripRows = page.locator('[class*="trip" i][class*="card" i], [class*="Trip"][class*="Card"], tr[class*="trip" i]');
    const count = await tripRows.count();
    console.log(`Trip cards/rows found: ${count}`);
    
    if (count > 0) {
      // Try clicking the card/row itself (not the button)
      const firstCard = tripRows.first();
      await firstCard.click();
      await page.waitForTimeout(1500);
      
      // Check if details panel opened
      const detailsPanel = page.locator('[class*="detail" i], [class*="Detail"], [class*="panel" i][class*="open" i]');
      const detailsVisible = await detailsPanel.first().isVisible().catch(() => false);
      console.log(`Details panel visible after row click: ${detailsVisible} (should be true)`);
      
      await page.screenshot({ path: 'tests/screenshots/driver-row-click.png', fullPage: true });
    }
  });

  test('BUG: Driver dashboard - contracts click does not open details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for contract-related items in driver dashboard
    const contractItems = page.locator('[class*="contract" i], [class*="Contract"], text=Contrato');
    const count = await contractItems.count();
    console.log(`Contract items found: ${count}`);
    
    if (count > 0) {
      await contractItems.first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/driver-contract-click.png', fullPage: true });
    }
  });

  test('BUG: Driver spendings mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate to gastos
    const gastosLink = page.locator('a[href*="gasto"], nav >> text=Gasto, [class*="nav"] >> text=Gasto').first();
    if (await gastosLink.isVisible()) {
      await gastosLink.click();
    } else {
      await page.goto('/gastos');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/driver-spendings-mobile.png', fullPage: true });
    
    // Check cards uniformity
    const spendingCards = page.locator('[class*="spending" i][class*="card" i], [class*="gasto" i][class*="card" i], [class*="Card"]');
    const count = await spendingCards.count();
    console.log(`Spending cards found (mobile): ${count}`);
    
    if (count >= 2) {
      const card1Box = await spendingCards.nth(0).boundingBox();
      const card2Box = await spendingCards.nth(1).boundingBox();
      if (card1Box && card2Box) {
        console.log(`Card 1 width: ${card1Box.width}, Card 2 width: ${card2Box.width}`);
        console.log(`Cards same width: ${Math.abs(card1Box.width - card2Box.width) < 2}`);
      }
    }
  });

  test('BUG: Driver vales - card format and click handler', async ({ page }) => {
    // Navigate to vales section
    const valesLink = page.locator('a[href*="vale"], nav >> text=Vale').first();
    if (await valesLink.isVisible()) {
      await valesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/driver-vales.png', fullPage: true });
    
    // Check for "Vales Registrados" text that should be removed
    const valesText = page.locator('text=Vales Registrados, text=vales registrados');
    const hasText = await valesText.count() > 0;
    console.log(`"Vales Registrados" text present: ${hasText} (should be false)`);
    
    // Check button text
    const assignBtn = page.locator('button:has-text("Asignar Vale")');
    const solicitarBtn = page.locator('button:has-text("Solicitar Vale")');
    console.log(`"Asignar Vale" button: ${await assignBtn.count()} (should be 0)`);
    console.log(`"Solicitar Vale" button: ${await solicitarBtn.count()} (should be > 0)`);
    
    // Check vale cards clickability
    const valeCards = page.locator('[class*="vale" i][class*="card" i], [class*="Vale"][class*="Card"]');
    const cardCount = await valeCards.count();
    console.log(`Vale cards found: ${cardCount}`);
  });

  test('BUG: Add vale modal - concept should be optional', async ({ page }) => {
    // Navigate to vales and open add modal
    const valesLink = page.locator('a[href*="vale"], nav >> text=Vale').first();
    if (await valesLink.isVisible()) {
      await valesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    const addBtn = page.locator('button:has-text("Solicitar"), button:has-text("Asignar"), button:has-text("Agregar")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'tests/screenshots/add-vale-modal.png' });
      
      // Check if concept field is marked as optional
      const conceptLabel = page.locator('label:has-text("Concepto"), label:has-text("concepto")');
      if (await conceptLabel.first().isVisible()) {
        const labelText = await conceptLabel.first().textContent();
        console.log(`Concept label: "${labelText}"`);
        const isOptional = labelText?.includes('opcional') || labelText?.includes('Opcional');
        console.log(`Marked as optional: ${isOptional}`);
      }
    }
  });
});

test.describe('Driver/Gastos Bugs - Oficina Role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'oficina');
    await page.waitForTimeout(2000);
  });

  test('BUG: Register vale - driver selection and padding', async ({ page }) => {
    // Navigate to vales management from admin
    const valesLink = page.locator('a[href*="vale"], nav >> text=Vale').first();
    if (await valesLink.isVisible()) {
      await valesLink.click();
    } else {
      await page.goto('/dashboard');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Open register vale modal
    const registerBtn = page.locator('button:has-text("Registrar"), button:has-text("Asignar")').first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'tests/screenshots/register-vale-modal.png' });
      
      // Try to select a driver
      const driverSelect = page.locator('[class*="driver" i] select, [class*="chofer" i] select, select, [role="combobox"]');
      const selectCount = await driverSelect.count();
      console.log(`Driver select elements: ${selectCount}`);
      
      if (selectCount > 0) {
        await driverSelect.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/vale-driver-select-open.png' });
      }
    }
  });
});
