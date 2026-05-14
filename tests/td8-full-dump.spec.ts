import { test } from '@playwright/test';
import { login } from './helpers';

test('Dump ALL computed styles on td[8] and its ancestors', async ({ page }) => {
  await login(page, 'oficina');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const result = await page.evaluate(() => {
    // Get the exact element: tr[2]/td[8] (last td in second data row)
    const rows = document.querySelectorAll('table tbody tr');
    if (rows.length < 2) return { error: 'Not enough rows' };
    
    const row = rows[1]; // tr[2]
    const tds = row.querySelectorAll('td');
    const lastTd = tds[tds.length - 1]; // last td (actions)
    
    const getRelevantStyles = (el: Element, label: string) => {
      const cs = getComputedStyle(el);
      return {
        label,
        tag: el.tagName,
        className: el.className?.toString().substring(0, 120),
        border: cs.border,
        borderBottom: cs.borderBottom,
        borderTop: cs.borderTop,
        boxShadow: cs.boxShadow,
        outline: cs.outline,
        filter: cs.filter,
        borderCollapse: (cs as any).borderCollapse,
        borderSpacing: (cs as any).borderSpacing,
      };
    };

    const styles: any[] = [];
    
    // The td itself
    styles.push(getRelevantStyles(lastTd, 'td[last] (actions)'));
    
    // Previous td for comparison
    if (tds.length > 1) {
      styles.push(getRelevantStyles(tds[tds.length - 2], 'td[last-1] (status)'));
    }
    
    // The tr
    styles.push(getRelevantStyles(row, 'tr'));
    
    // The tbody
    styles.push(getRelevantStyles(row.parentElement!, 'tbody'));
    
    // The table
    styles.push(getRelevantStyles(row.parentElement!.parentElement!, 'table'));
    
    // Also check ALL children inside the last td
    const children: any[] = [];
    lastTd.querySelectorAll('*').forEach((child, i) => {
      const cs = getComputedStyle(child);
      if (cs.border !== '0px none rgb(0, 0, 0)' && cs.border !== '' || 
          cs.boxShadow !== 'none' || 
          cs.outline !== 'rgb(0, 0, 0) none 0px') {
        children.push({
          index: i,
          tag: child.tagName,
          className: child.className?.toString().substring(0, 80),
          border: cs.border,
          borderBottom: cs.borderBottom,
          boxShadow: cs.boxShadow,
          outline: cs.outline,
        });
      }
    });
    
    return { styles, childrenWithBorders: children };
  });

  console.log('Element styles:');
  console.log(JSON.stringify(result, null, 2));
});
