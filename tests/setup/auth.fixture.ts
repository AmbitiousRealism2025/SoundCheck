import { test as base, expect } from '@playwright/test';

// Mock user data for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User'
};

// Mock authentication middleware
export async function mockAuth(page) {
  // Mock the authentication state by setting up routes
  await page.route('**/api/auth/user', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser)
    });
  });

  // Mock rehearsals API
  await page.route('**/api/rehearsals', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Mock gigs API
  await page.route('**/api/gigs', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Mock earnings API
  await page.route('**/api/earnings**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Mock calendar API
  await page.route('**/api/calendar**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
}

// Create a custom test fixture with authentication
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up mock authentication before each test
    await mockAuth(page);
    await use(page);
  }
});

export { expect };