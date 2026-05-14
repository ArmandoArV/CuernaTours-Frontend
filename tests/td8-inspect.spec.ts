import { test } from '@playwright/test';
import { login } from './helpers';

test('Inspect td[8] exact element', async ({ page }) => {
  await login(page, 'oficina');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Use the exact XPath the user provided
  const td = page.locator('xpath=/html/body/div[2]/div/div/main/div/div/div/div[2]/table/tbody/tr[2]/td[8]');
  
  if (await td.isVisible()) {
    const styles = await td.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        boxShadow: cs.boxShadow,
        border: cs.border,
        borderLeft: cs.borderLeft,
        borderRight: cs.borderRight,
        borderTop: cs.borderTop,
        borderBottom: cs.borderBottom,
        outline: cs.outline,
        background: cs.background,
        backgroundColor: cs.backgroundColor,
        className: el.className,
        innerHTML: el.innerHTML.substring(0, 200),
      };
    });
    console.log('td[8] styles:', JSON.stringify(styles, null, 2));
    
    // Also check the td's previous sibling (td[7]) to compare
    const td7 = page.locator('xpath=/html/body/div[2]/div/div/main/div/div/div/div[2]/table/tbody/tr[2]/td[7]');
    const styles7 = await td7.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        boxShadow: cs.boxShadow,
        border: cs.border,
        borderRight: cs.borderRight,
        backgroundColor: cs.backgroundColor,
        className: el.className,
      };
    });
    console.log('td[7] styles (for comparison):', JSON.stringify(styles7, null, 2));

    // Screenshot the specific td
    await td.screenshot({ path: 'tests/screenshots/td8-exact.png' });
    
    // Screenshot wider area
    const box = await td.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'tests/screenshots/td8-area.png',
        clip: {
          x: Math.max(0, box.x - 50),
          y: Math.max(0, box.y - 10),
          width: box.width + 100,
          height: box.height + 20,
        },
      });
    }
  } else {
    console.log('td[8] not found');
  }
});
