import { test as base, expect } from '@playwright/test';

// Mock user data for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User'
};

// Mock authentication middleware with Authorization header verification
export async function mockAuth(page) {
  // Helper to verify Authorization header is present
  const verifyAuthHeader = (route) => {
    const headers = route.request().headers();
    const authHeader = headers['authorization'];

    // Log for debugging if needed
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Request missing Authorization header:', route.request().url());
    }

    return authHeader && authHeader.startsWith('Bearer ');
  };

  // Mock the authentication state by setting up routes
  await page.route('**/api/auth/user', (route) => {
    // Verify Authorization header is present
    const hasAuth = verifyAuthHeader(route);

    route.fulfill({
      status: hasAuth ? 200 : 401,
      contentType: 'application/json',
      body: hasAuth ? JSON.stringify(mockUser) : JSON.stringify({ error: 'Unauthorized' })
    });
  });

  // Mock rehearsals API
  await page.route('**/api/rehearsals', (route) => {
    const hasAuth = verifyAuthHeader(route);

    route.fulfill({
      status: hasAuth ? 200 : 401,
      contentType: 'application/json',
      body: hasAuth ? JSON.stringify([]) : JSON.stringify({ error: 'Unauthorized' })
    });
  });

  // Mock gigs API
  await page.route('**/api/gigs', (route) => {
    const hasAuth = verifyAuthHeader(route);

    route.fulfill({
      status: hasAuth ? 200 : 401,
      contentType: 'application/json',
      body: hasAuth ? JSON.stringify([]) : JSON.stringify({ error: 'Unauthorized' })
    });
  });

  // Mock earnings API
  await page.route('**/api/earnings**', (route) => {
    const hasAuth = verifyAuthHeader(route);

    route.fulfill({
      status: hasAuth ? 200 : 401,
      contentType: 'application/json',
      body: hasAuth ? JSON.stringify([]) : JSON.stringify({ error: 'Unauthorized' })
    });
  });

  // Mock calendar API
  await page.route('**/api/calendar**', (route) => {
    const hasAuth = verifyAuthHeader(route);

    route.fulfill({
      status: hasAuth ? 200 : 401,
      contentType: 'application/json',
      body: hasAuth ? JSON.stringify([]) : JSON.stringify({ error: 'Unauthorized' })
    });
  });
}

// Create a custom test fixture with authentication
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up mock authentication before each test
    await mockAuth(page);

    // Seed Supabase session to establish client-side authentication
    await seedSupabaseSession(page);

    await use(page);
  }
});

// Create an alternative fixture without session seeding for tests that don't need auth
export const testNoAuth = base.extend({
  page: async ({ page }, use) => {
    // Only set up API mocks without seeding session
    await mockAuth(page);
    await use(page);
  }
});

// Helper function to seed Supabase session for testing
export async function seedSupabaseSession(page) {
  // Simulate the Supabase auth callback flow by navigating to the callback URL
  // with fake tokens to establish a session in the client
  const fakeAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTk5NDgzNTIwMH0.fake-signature';
  const fakeRefreshToken = 'fake-refresh-token';

  // Navigate to the auth callback with fake tokens in the URL fragment
  await page.goto(`/auth/callback#access_token=${fakeAccessToken}&refresh_token=${fakeRefreshToken}`);

  // Wait for the session to be established
  await page.waitForTimeout(1000);

  // Navigate back to the home page after session is established
  await page.goto('/');
}

export { expect };