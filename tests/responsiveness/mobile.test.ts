import { test, expect } from '@playwright/test';
import { mockUser } from '../setup/auth.fixture';

test.describe('Mobile Responsiveness', () => {
  const mobileDevices = [
    { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
    { name: 'Pixel 5', viewport: { width: 393, height: 851 } },
    { name: 'Small Phone', viewport: { width: 320, height: 568 } }
  ];

  mobileDevices.forEach(({ name, viewport }) => {
    test.describe(`on ${name}`, () => {
      test.beforeEach(async ({ page }) => {
        // Set viewport size
        await page.setViewportSize(viewport);

        // Mock successful authentication
        await page.route('**/api/auth/user', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockUser)
          });
        });

        // Mock empty data
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

      test('should display responsive layout correctly', async ({ page }) => {
        // Verify header is responsive
        const header = page.getByTestId('header');
        await expect(header).toBeVisible();

        // Check that header fits within viewport
        const headerBox = await header.boundingBox();
        expect(headerBox.width).toBeLessThanOrEqual(viewport.width);

        // Verify content area is properly constrained
        const contentArea = page.locator('.max-w-md');
        if (await contentArea.count() > 0) {
          const contentBox = await contentArea.first().boundingBox();
          expect(contentBox.width).toBeLessThanOrEqual(viewport.width);
        }
      });

      test('should handle tab navigation on mobile', async ({ page }) => {
        // Verify all tabs are visible
        const tabs = page.locator('[data-testid^="tab-"]');
        const tabCount = await tabs.count();
        expect(tabCount).toBe(4);

        // Check that tabs are properly sized for mobile
        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i);
          await expect(tab).toBeVisible();

          const tabBox = await tab.boundingBox();
          expect(tabBox.width).toBeGreaterThan(0);
          expect(tabBox.width).toBeLessThanOrEqual(viewport.width / 4); // Roughly equal width
        }

        // Test tab switching
        await page.getByTestId('tab-gigs').click();
        await expect(page.getByTestId('gigs-content')).toBeVisible();

        await page.getByTestId('tab-earnings').click();
        await expect(page.getByTestId('earnings-content')).toBeVisible();
      });

      test('should display mobile-friendly floating action button', async ({ page }) => {
        const fab = page.getByTestId('button-fab-toggle');

        // Verify FAB is visible and properly positioned
        await expect(fab).toBeVisible();

        const fabBox = await fab.boundingBox();
        expect(fabBox.x + fabBox.width).toBeCloseTo(viewport.width - 20, 0); // Right margin
        expect(fabBox.y + fabBox.height).toBeCloseTo(viewport.height - 80, 0); // Bottom margin

        // Test FAB menu opening
        await fab.click();
        await expect(page.getByTestId('button-new-rehearsal')).toBeVisible();
        await expect(page.getByTestId('button-new-gig')).toBeVisible();
      });

      test('should handle modals on mobile', async ({ page }) => {
        // Open FAB and click new rehearsal
        await page.getByTestId('button-fab-toggle').click();
        await page.getByTestId('button-new-rehearsal').click();

        // Verify modal is visible and properly sized
        const modal = page.getByTestId('rehearsal-form-modal');
        await expect(modal).toBeVisible();

        const modalBox = await modal.boundingBox();
        expect(modalBox.width).toBeLessThanOrEqual(viewport.width - 40); // Side margins
        expect(modalBox.height).toBeLessThanOrEqual(viewport.height - 40); // Top/bottom margins

        // Test form inputs are mobile-friendly
        const inputs = modal.locator('input');
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputBox = await input.boundingBox();
          expect(inputBox.width).toBeGreaterThan(0);
          expect(inputBox.width).toBeLessThanOrEqual(viewport.width - 80); // Account for padding
        }

        // Close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      });

      test('should display responsive cards properly', async ({ page }) => {
        // Create some mock data
        await page.route('**/api/rehearsals', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 1,
                eventName: 'Mobile Test Rehearsal',
                location: 'Test Studio',
                date: '2024-12-25T18:00:00.000Z',
                tasks: []
              }
            ])
          });
        });

        await page.getByTestId('tab-rehearsals').click();

        // Verify rehearsal card is properly sized
        const card = page.getByTestId('rehearsal-card-1');
        await expect(card).toBeVisible();

        const cardBox = await card.boundingBox();
        expect(cardBox.width).toBeLessThanOrEqual(viewport.width - 32); // Account for padding

        // Verify text is readable (not too small)
        const title = page.getByTestId('text-rehearsal-name-1');
        const titleBox = await title.boundingBox();
        expect(titleBox.height).toBeGreaterThan(16); // Minimum readable height
      });

      test('should handle touch interactions', async ({ page }) => {
        // Test tab touch interaction
        const gigsTab = page.getByTestId('tab-gigs');
        await gigsTab.tap();
        await expect(page.getByTestId('gigs-content')).toBeVisible();

        // Test FAB touch interaction
        const fab = page.getByTestId('button-fab-toggle');
        await fab.tap();
        await expect(page.getByTestId('button-new-rehearsal')).toBeVisible();

        // Test modal close with backdrop tap
        const modal = page.getByTestId('rehearsal-form-modal');
        const backdrop = modal.locator('..').locator('..'); // Assuming modal has backdrop
        await backdrop.tap({ position: { x: 10, y: 10 } }); // Tap outside modal
        await expect(modal).not.toBeVisible();
      });

      test('should handle landscape orientation', async ({ page }) => {
        // Switch to landscape
        await page.setViewportSize({ width: viewport.height, height: viewport.width });

        // Verify layout adapts
        await expect(page.getByTestId('header')).toBeVisible();
        await expect(page.getByTestId('tab-navigation')).toBeVisible();

        // Test that content is still accessible
        await page.getByTestId('tab-gigs').click();
        await expect(page.getByTestId('gigs-content')).toBeVisible();

        // Test FAB in landscape
        await page.getByTestId('button-fab-toggle').click();
        await expect(page.getByTestId('button-new-rehearsal')).toBeVisible();
      });

      test('should display mobile-optimized empty states', async ({ page }) => {
        // Test rehearsals empty state
        await page.getByTestId('tab-rehearsals').click();
        const emptyRehearsals = page.getByTestId('rehearsals-empty');
        await expect(emptyRehearsals).toBeVisible();

        // Verify empty state content fits screen
        const emptyBox = await emptyRehearsals.boundingBox();
        expect(emptyBox.height).toBeLessThanOrEqual(viewport.height);

        // Test gigs empty state
        await page.getByTestId('tab-gigs').click();
        const emptyGigs = page.getByTestId('gigs-empty');
        await expect(emptyGigs).toBeVisible();
      });

      test('should handle keyboard properly on mobile', async ({ page }) => {
        // Open modal
        await page.getByTestId('button-fab-toggle').click();
        await page.getByTestId('button-new-rehearsal').click();

        // Test keyboard appearance when focusing input
        const eventNameInput = page.getByTestId('input-event-name');
        await eventNameInput.focus();

        // Verify input is focused (visual indication might vary)
        await expect(eventNameInput).toBeFocused();

        // Test keyboard dismissal
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('rehearsal-form-modal')).not.toBeVisible();
      });

      test('should have proper touch targets', async ({ page }) => {
        // Test tab touch targets (minimum 48x48 points for accessibility)
        const tabs = page.locator('[data-testid^="tab-"]');
        const tabCount = await tabs.count();

        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i);
          const tabBox = await tab.boundingBox();
          expect(tabBox.width).toBeGreaterThanOrEqual(44);
          expect(tabBox.height).toBeGreaterThanOrEqual(44);
        }

        // Test FAB touch target
        const fab = page.getByTestId('button-fab-toggle');
        const fabBox = await fab.boundingBox();
        expect(fabBox.width).toBeGreaterThanOrEqual(48);
        expect(fabBox.height).toBeGreaterThanOrEqual(48);
      });
    });
  });
});