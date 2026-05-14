import { Page, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

export const CREDENTIALS = {
  oficina: { email: process.env.TEST_OFICINA_EMAIL!, password: process.env.TEST_OFICINA_PASSWORD! },
  chofer: { email: process.env.TEST_CHOFER_EMAIL!, password: process.env.TEST_CHOFER_PASSWORD! },
  fernando: { email: process.env.TEST_FERNANDO_EMAIL!, password: process.env.TEST_FERNANDO_PASSWORD! },
};

export async function login(page: Page, role: keyof typeof CREDENTIALS) {
  const creds = CREDENTIALS[role];
  await page.goto('/');
  // Wait for the login page to load
  await page.waitForLoadState('networkidle');
  
  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="correo" i], input[placeholder*="email" i]').first();
  await emailInput.waitFor({ timeout: 15000 });
  await emailInput.fill(creds.email);
  
  // Fill password
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(creds.password);
  
  // Click login button
  const loginBtn = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")').first();
  await loginBtn.click();
  
  // Wait for navigation away from login
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}
