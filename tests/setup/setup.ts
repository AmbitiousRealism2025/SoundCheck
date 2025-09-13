import { test as base, expect } from '@playwright/test';

// Global test configuration
export const expect = expect;

// Mock user data for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User'
};

// Mock authentication middleware
export async function setupMockAuth(page) {
  // Mock the authentication state by setting up routes
  await page.route('**/api/auth/user', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser)
    });
  });
}

// Mock API responses
export async function setupMockAPI(page) {
  // Mock empty rehearsals list
  await page.route('**/api/rehearsals', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Mock empty gigs list
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

// Create test data generators
export const testData = {
  rehearsals: {
    basic: {
      eventName: 'Test Rehearsal',
      location: 'Test Studio',
      date: '2024-12-25T18:00:00.000Z',
      tasks: []
    },
    withTasks: {
      eventName: 'Rehearsal with Tasks',
      location: 'Music Room',
      date: '2024-12-25T18:00:00.000Z',
      tasks: [
        { id: 1, title: 'Practice scales', status: 'open', order: 0 },
        { id: 2, title: 'Learn new song', status: 'open', order: 1 }
      ]
    }
  },
  gigs: {
    basic: {
      venueName: 'Test Venue',
      venueAddress: '123 Test Street',
      venueContact: 'contact@testvenue.com',
      date: '2024-12-25T19:00:00.000Z',
      callTime: '2024-12-25T18:00:00.000Z',
      compensation: '500',
      notes: 'Test gig notes'
    },
    noCompensation: {
      venueName: 'Free Gig',
      venueAddress: '123 Test Street',
      venueContact: 'contact@testvenue.com',
      date: '2024-12-25T19:00:00.000Z',
      callTime: '2024-12-25T18:00:00.000Z',
      compensation: null,
      notes: 'Charity event'
    }
  }
};

// Custom matchers
expect.extend({
  toBeVisibleWithinViewport(element) {
    const boundingBox = element.boundingBox();
    if (!boundingBox) {
      return {
        message: () => 'Element is not visible',
        pass: false
      };
    }
    return {
      message: () => 'Element is visible within viewport',
      pass: true
    };
  }
});

// Test utilities
export const testUtils = {
  // Wait for element to be stable (not moving)
  async waitForStableElement(page, selector) {
    let previousBox = null;
    let stableCount = 0;

    while (stableCount < 3) {
      await page.waitForTimeout(100);
      const currentBox = await page.locator(selector).boundingBox();

      if (!previousBox ||
          Math.abs(previousBox.x - currentBox.x) > 1 ||
          Math.abs(previousBox.y - currentBox.y) > 1) {
        stableCount = 0;
      } else {
        stableCount++;
      }

      previousBox = currentBox;
    }
  },

  // Check if element is accessible (has proper contrast, size, etc.)
  async isAccessible(page, selector) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();

    const box = await element.boundingBox();
    return box && box.width > 0 && box.height > 0;
  },

  // Simulate mobile device
  async simulateMobile(page, device = 'iPhone 12') {
    const devices = {
      'iPhone 12': { width: 390, height: 844 },
      'Pixel 5': { width: 393, height: 851 },
      'iPad': { width: 768, height: 1024 }
    };

    const viewport = devices[device] || devices['iPhone 12'];
    await page.setViewportSize(viewport);
  },

  // Clear all cookies and local storage
  async clearUserData(page) {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
};

// Export everything
export * from '@playwright/test';