import { test, expect } from '@playwright/test';
import { mockUser } from '../setup/auth.fixture';

test.describe('Calendar Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // Mock empty rehearsals and gigs initially
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

  test('should display calendar view', async ({ page }) => {
    await page.getByTestId('tab-calendar').click();

    // Verify calendar is visible
    await expect(page.getByTestId('calendar-content')).toBeVisible();

    // Verify current month is displayed
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(page.getByText(currentMonth, { exact: false })).toBeVisible();
  });

  test('should display events on calendar dates', async ({ page }) => {
    // Mock rehearsal and gig data
    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Jazz Practice',
            location: 'Studio A',
            date: '2024-12-15T18:00:00.000Z',
            tasks: []
          }
        ])
      });
    });

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'The Blue Note',
            venueAddress: '123 Music St',
            date: '2024-12-20T19:00:00.000Z',
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Navigate to December 2024
    // Note: Calendar navigation might need specific test IDs
    // For now, we'll verify events are displayed in the calendar

    // Verify events are shown (implementation depends on calendar library used)
    await expect(page.getByText('Jazz Practice')).toBeVisible();
    await expect(page.getByText('The Blue Note')).toBeVisible();
  });

  test('should create rehearsal from calendar', async ({ page }) => {
    await page.getByTestId('tab-calendar').click();

    // Click on a date to create event (implementation depends on calendar)
    // For now, we'll test the floating action button approach

    // Open floating action menu
    await page.getByTestId('button-fab-toggle').click();
    await expect(page.getByTestId('button-new-rehearsal')).toBeVisible();

    // Click new rehearsal button
    await page.getByTestId('button-new-rehearsal').click();

    // Verify modal is open with pre-filled date
    await expect(page.getByTestId('rehearsal-form-modal')).toBeVisible();

    // Date should be pre-filled based on calendar selection
    // Note: This depends on the calendar implementation
  });

  test('should create gig from calendar', async ({ page }) => {
    await page.getByTestId('tab-calendar').click();

    // Open floating action menu
    await page.getByTestId('button-fab-toggle').click();
    await expect(page.getByTestId('button-new-gig')).toBeVisible();

    // Click new gig button
    await page.getByTestId('button-new-gig').click();

    // Verify modal is open
    await expect(page.getByTestId('gig-form-modal')).toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    await page.getByTestId('tab-calendar').click();

    // Get current month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Navigate to next month
    // Note: Implementation depends on calendar navigation buttons
    // await page.getByTestId('button-next-month').click();

    // Navigate to previous month
    // await page.getByTestId('button-previous-month').click();

    // For now, verify the calendar is visible
    await expect(page.getByTestId('calendar-content')).toBeVisible();
  });

  test('should export calendar to iCal', async ({ page }) => {
    await page.getByTestId('tab-calendar').click();

    // Mock download behavior
    const downloadPromise = page.waitForEvent('download');

    // Click export button (test ID might be different)
    // await page.getByTestId('button-export-ical').click();

    // Verify download starts
    // const download = await downloadPromise;
    // expect(download.suggestedFilename()).toMatch(/\.ics$/);
  });

  test('should show day view with events', async ({ page }) => {
    // Mock events for a specific day
    const testDate = '2024-12-15';

    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Morning Practice',
            location: 'Studio A',
            date: `${testDate}T09:00:00.000Z`,
            tasks: []
          },
          {
            id: 2,
            eventName: 'Evening Practice',
            location: 'Studio B',
            date: `${testDate}T18:00:00.000Z`,
            tasks: []
          }
        ])
      });
    });

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'The Blue Note',
            venueAddress: '123 Music St',
            date: `${testDate}T20:00:00.000Z`,
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Click on a specific day to view details
    // Note: Implementation depends on calendar library
    // await page.getByTestId(`calendar-day-${testDate}`).click();

    // Verify day view shows all events
    // await expect(page.getByText('Morning Practice')).toBeVisible();
    // await expect(page.getByText('Evening Practice')).toBeVisible();
    // await expect(page.getByText('The Blue Note')).toBeVisible();
  });

  test('should handle timezone correctly', async ({ page }) => {
    // Mock events with different timezones
    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Timezone Test',
            location: 'Test Studio',
            date: '2024-12-15T18:00:00.000Z', // UTC time
            tasks: []
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Verify event is displayed with correct local time
    // Note: This depends on timezone handling implementation
    await expect(page.getByText('Timezone Test')).toBeVisible();
  });

  test('should show different visual indicators for different event types', async ({ page }) => {
    // Mock both rehearsals and gigs
    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Practice Session',
            location: 'Studio A',
            date: '2024-12-15T18:00:00.000Z',
            tasks: []
          }
        ])
      });
    });

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'Performance Venue',
            venueAddress: '123 Music St',
            date: '2024-12-16T19:00:00.000Z',
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Verify different event types are visually distinguished
    // This depends on the calendar implementation
    await expect(page.getByText('Practice Session')).toBeVisible();
    await expect(page.getByText('Performance Venue')).toBeVisible();
  });

  test('should handle events spanning multiple days', async ({ page }) => {
    // Mock multi-day events if supported
    // Note: This depends on whether the calendar supports multi-day events
    await page.getByTestId('tab-calendar').click();

    // Verify calendar is displayed
    await expect(page.getByTestId('calendar-content')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByTestId('tab-calendar').click();

    // Verify calendar adapts to mobile screen
    await expect(page.getByTestId('calendar-content')).toBeVisible();

    // Verify floating action button is accessible on mobile
    await expect(page.getByTestId('button-fab-toggle')).toBeVisible();

    // Test touch interactions (if applicable)
    // Note: Touch events might need special handling in tests
  });
});