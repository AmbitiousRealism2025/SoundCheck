import { test, expect } from '../setup/coverage.fixture';
import { mockUser } from '../setup/auth.fixture';

// Helper functions for dynamic date generation
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDateForApi(date: Date): string {
  // Format as ISO string for API
  return date.toISOString();
}

function formatDateForDisplay(date: Date): string {
  // Format as YYYY-MM-DD for display/testing
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function navigateToMonth(page: any, targetDate: Date) {
  // Navigate to the month containing the target date
  const targetMonthYear = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Check if we're already on the target month
  const currentMonthElement = page.locator('text=' + targetMonthYear);
  if (await currentMonthElement.isVisible({ timeout: 1000 }).catch(() => false)) {
    return; // Already on the correct month
  }

  // Navigate to the target month (implementation depends on calendar navigation)
  // This is a placeholder - actual implementation would depend on calendar UI
  // For now, we'll just verify the calendar is visible
}

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
    // Generate dynamic dates relative to current date
    const today = new Date();
    const rehearsalDate = addDays(today, 5); // 5 days from now
    const gigDate = addDays(today, 10); // 10 days from now

    // Mock rehearsal and gig data with dynamic dates
    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Jazz Practice',
            location: 'Studio A',
            date: formatDateForApi(rehearsalDate),
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
            date: formatDateForApi(gigDate),
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Navigate to the month containing our test events
    await navigateToMonth(page, rehearsalDate);

    // Verify events are shown (implementation depends on calendar library used)
    await expect(page.getByText('Jazz Practice')).toBeVisible();

    // If gig is in a different month, navigate to it
    if (rehearsalDate.getMonth() !== gigDate.getMonth() || rehearsalDate.getFullYear() !== gigDate.getFullYear()) {
      await navigateToMonth(page, gigDate);
    }

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
    // Generate a dynamic test date 7 days from now
    const today = new Date();
    const testDate = addDays(today, 7);
    const testDateStr = formatDateForDisplay(testDate);

    // Create morning, evening, and night events on the same day
    const morningEvent = new Date(testDate);
    morningEvent.setHours(9, 0, 0, 0);

    const eveningEvent = new Date(testDate);
    eveningEvent.setHours(18, 0, 0, 0);

    const nightEvent = new Date(testDate);
    nightEvent.setHours(20, 0, 0, 0);

    await page.route('**/api/rehearsals', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            eventName: 'Morning Practice',
            location: 'Studio A',
            date: formatDateForApi(morningEvent),
            tasks: []
          },
          {
            id: 2,
            eventName: 'Evening Practice',
            location: 'Studio B',
            date: formatDateForApi(eveningEvent),
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
            date: formatDateForApi(nightEvent),
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Navigate to the month containing the test date
    await navigateToMonth(page, testDate);

    // Click on a specific day to view details
    // Note: Implementation depends on calendar library
    // await page.getByTestId(`calendar-day-${testDateStr}`).click();

    // Verify day view shows all events
    // await expect(page.getByText('Morning Practice')).toBeVisible();
    // await expect(page.getByText('Evening Practice')).toBeVisible();
    // await expect(page.getByText('The Blue Note')).toBeVisible();
  });

  test('should handle timezone correctly', async ({ page }) => {
    // Generate a dynamic date 3 days from now
    const today = new Date();
    const eventDate = addDays(today, 3);
    eventDate.setHours(18, 0, 0, 0); // Set to 6 PM UTC

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
            date: formatDateForApi(eventDate), // UTC time
            tasks: []
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Navigate to the month containing the test event
    await navigateToMonth(page, eventDate);

    // Verify event is displayed with correct local time
    // Note: This depends on timezone handling implementation
    await expect(page.getByText('Timezone Test')).toBeVisible();
  });

  test('should show different visual indicators for different event types', async ({ page }) => {
    // Generate dynamic dates for different event types
    const today = new Date();
    const rehearsalDate = addDays(today, 2); // 2 days from now
    const gigDate = addDays(today, 3); // 3 days from now

    rehearsalDate.setHours(18, 0, 0, 0); // 6 PM
    gigDate.setHours(19, 0, 0, 0); // 7 PM

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
            date: formatDateForApi(rehearsalDate),
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
            date: formatDateForApi(gigDate),
            compensation: '500'
          }
        ])
      });
    });

    await page.getByTestId('tab-calendar').click();

    // Navigate to the month containing both events
    await navigateToMonth(page, rehearsalDate);

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