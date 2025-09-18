import { test, expect } from '../setup/coverage.fixture';
import { mockUser } from '../setup/auth.fixture';

test.describe('Home Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // Mock empty data for all tabs
    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');
  });

  test('should display initial navigation state correctly', async ({ page }) => {
    // Check that the header is visible
    await expect(page.getByTestId('header')).toBeVisible();

    // Check that the app title is visible
    await expect(page.getByTestId('text-app-title')).toHaveText('SoundCheck');

    // Check that the tab navigation is visible
    await expect(page.getByTestId('tab-navigation')).toBeVisible();

    // Check that all tabs are visible
    await expect(page.getByTestId('tab-rehearsals')).toBeVisible();
    await expect(page.getByTestId('tab-gigs')).toBeVisible();
    await expect(page.getByTestId('tab-earnings')).toBeVisible();
    await expect(page.getByTestId('tab-calendar')).toBeVisible();

    // Check that the rehearsals tab is active by default
    await expect(page.getByTestId('rehearsals-content')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click on gigs tab and check content visibility
    await page.getByTestId('tab-gigs').click();
    await expect(page.getByTestId('gigs-content')).toBeVisible();

    // Click on earnings tab and check content visibility
    await page.getByTestId('tab-earnings').click();
    await expect(page.getByTestId('earnings-content')).toBeVisible();

    // Click on calendar tab and check content visibility
    await page.getByTestId('tab-calendar').click();
    await expect(page.getByTestId('calendar-content')).toBeVisible();

    // Click back on rehearsals tab and check content visibility
    await page.getByTestId('tab-rehearsals').click();
    await expect(page.getByTestId('rehearsals-content')).toBeVisible();

    // Test that only one tab content is visible at a time
    await expect(page.getByTestId('rehearsals-content')).toBeVisible();
    await expect(page.getByTestId('gigs-content')).not.toBeVisible();
    await expect(page.getByTestId('earnings-content')).not.toBeVisible();
    await expect(page.getByTestId('calendar-content')).not.toBeVisible();
  });

  test('should show and hide floating action button appropriately', async ({ page }) => {
    // FAB should be visible on all tabs
    await expect(page.getByTestId('button-fab-toggle')).toBeVisible();

    // Test FAB visibility on different tabs
    await page.getByTestId('tab-gigs').click();
    await expect(page.getByTestId('button-fab-toggle')).toBeVisible();

    await page.getByTestId('tab-earnings').click();
    await expect(page.getByTestId('button-fab-toggle')).toBeVisible();

    await page.getByTestId('tab-calendar').click();
    await expect(page.getByTestId('button-fab-toggle')).toBeVisible();
  });

  test('should maintain tab state across navigation', async ({ page }) => {
    // Navigate to gigs tab
    await page.getByTestId('tab-gigs').click();
    await expect(page.getByTestId('gigs-content')).toBeVisible();

    // Reload the page
    await page.reload();

    // Should still be on gigs tab after reload
    await expect(page.getByTestId('gigs-content')).toBeVisible();
    await expect(page.getByTestId('rehearsals-content')).not.toBeVisible();
  });
});