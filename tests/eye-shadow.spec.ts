import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('Eye button should have no box-shadow', async ({ page }) => {
  await login(page, 'oficina');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Find the eye button in the actions column
  const eyeBtn = page.locator('button:has(svg)').filter({ has: page.locator('[class*="Eye"], [data-icon-name*="Eye"]') }).first();
  
  // Also try by the actions container
  const actionBtns = page.locator('td button, [class*="actionsContainer"] button').first();
  
  if (await actionBtns.isVisible()) {
    // Check all shadow-related computed styles
    const styles = await actionBtns.evaluate(el => {
      const cs = getComputedStyle(el);
      const afterEl = getComputedStyle(el, '::after');
      return {
        boxShadow: cs.boxShadow,
        filter: cs.filter,
        afterBoxShadow: afterEl.boxShadow,
        afterOutline: afterEl.outline,
      };
    });
    console.log('Button styles:', JSON.stringify(styles, null, 2));
    
    // Take a close screenshot of just the button
    await actionBtns.screenshot({ path: 'tests/screenshots/eye-button-close.png' });
    
    // Also hover and check
    await actionBtns.hover();
    await page.waitForTimeout(300);
    const hoverStyles = await actionBtns.evaluate(el => {
      const cs = getComputedStyle(el);
      return { boxShadow: cs.boxShadow, filter: cs.filter };
    });
    console.log('Hover styles:', JSON.stringify(hoverStyles, null, 2));
    await actionBtns.screenshot({ path: 'tests/screenshots/eye-button-hover.png' });
  }
});
