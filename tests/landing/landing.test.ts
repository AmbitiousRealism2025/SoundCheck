import { test, expect } from '@playwright/test';

test('should display landing page with login button', async ({ page }) => {
  await page.goto('/');
  
  // Check that the app title is visible
  await expect(page.getByTestId('text-app-title')).toHaveText('SoundCheck');
  
  // Check that the login button is visible
  await expect(page.getByTestId('button-login')).toBeVisible();
  
  // Check that the login button has the correct text
  await expect(page.getByTestId('button-login')).toHaveText('Get Started');
});

test('should navigate to login when clicking login button', async ({ page }) => {
  await page.goto('/');
  
  // Click the login button
  await page.getByTestId('button-login').click();
  
  // Check that we're redirected to the login endpoint
  await expect(page).toHaveURL(/.*api\/login.*/);
});