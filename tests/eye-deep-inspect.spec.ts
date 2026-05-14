import { test } from '@playwright/test';
import { login } from './helpers';

test('Deep inspect eye button shadow', async ({ page }) => {
  await login(page, 'oficina');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Find all elements in the actions container and dump their computed styles
  const results = await page.evaluate(() => {
    const cells = document.querySelectorAll('td');
    const actionCells: any[] = [];
    
    cells.forEach((cell, i) => {
      const btn = cell.querySelector('button');
      if (!btn) return;
      const svg = btn.querySelector('svg');
      if (!svg) return;
      
      // This is likely an action cell
      const cellStyles = getComputedStyle(cell);
      const btnStyles = getComputedStyle(btn);
      const btnAfter = getComputedStyle(btn, '::after');
      const btnBefore = getComputedStyle(btn, '::before');
      
      // Walk up parents checking for shadows
      let parentShadows: any[] = [];
      let el: HTMLElement | null = btn;
      for (let depth = 0; depth < 5 && el; depth++) {
        const cs = getComputedStyle(el);
        if (cs.boxShadow !== 'none' || cs.filter !== 'none' || cs.webkitFilter !== 'none') {
          parentShadows.push({
            depth,
            tag: el.tagName,
            className: el.className?.substring(0, 80),
            boxShadow: cs.boxShadow,
            filter: cs.filter,
            border: cs.border,
            outline: cs.outline,
          });
        }
        el = el.parentElement;
      }
      
      actionCells.push({
        cellIndex: i,
        cell: {
          boxShadow: cellStyles.boxShadow,
          border: cellStyles.border,
          outline: cellStyles.outline,
        },
        btn: {
          boxShadow: btnStyles.boxShadow,
          border: btnStyles.border,
          outline: btnStyles.outline,
          filter: btnStyles.filter,
        },
        btnAfter: {
          boxShadow: btnAfter.boxShadow,
          border: btnAfter.border,
          outline: btnAfter.outline,
        },
        btnBefore: {
          boxShadow: btnBefore.boxShadow,
          border: btnBefore.border,
        },
        parentShadows,
      });
    });
    
    return actionCells;
  });
  
  console.log('Action button deep inspection:');
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
  
  // Take a zoomed screenshot of the first action cell
  const firstActionBtn = page.locator('td button:has(svg)').first();
  if (await firstActionBtn.isVisible()) {
    // Get parent td
    const td = firstActionBtn.locator('..');
    await td.screenshot({ path: 'tests/screenshots/action-cell-zoom.png' });
    
    // Also screenshot surrounding area
    const box = await firstActionBtn.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'tests/screenshots/action-area-zoom.png',
        clip: {
          x: Math.max(0, box.x - 30),
          y: Math.max(0, box.y - 30),
          width: box.width + 60,
          height: box.height + 60,
        },
      });
    }
  }
});
