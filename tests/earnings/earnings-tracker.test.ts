import { test, expect } from '@playwright/test';
import { mockUser } from '../setup/auth.fixture';

test.describe('Earnings Tracker', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // Mock empty gigs list initially
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');
  });

  test('should display empty state when no earnings exist', async ({ page }) => {
    await page.getByTestId('tab-earnings').click();

    await expect(page.getByTestId('earnings-empty')).toBeVisible();
    await expect(page.getByText('No earnings yet')).toBeVisible();
    await expect(page.getByText('Add gigs with compensation amounts to track your earnings')).toBeVisible();
  });

  test('should display total earnings correctly', async ({ page }) => {
    // Mock gigs with earnings
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'The Blue Note',
            compensation: '500',
            date: '2024-12-01T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: 'Jazz Club',
            compensation: '750',
            date: '2024-12-15T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: 'Music Hall',
            compensation: '1000',
            date: '2024-11-20T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify total earnings calculation
    await expect(page.getByTestId('total-earnings')).toHaveText('$2,250.00');
    await expect(page.getByTestId('average-earnings')).toHaveText('$750.00');
  });

  test('should exclude gigs without compensation from earnings', async ({ page }) => {
    // Mock gigs with some without compensation
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'The Blue Note',
            compensation: '500',
            date: '2024-12-01T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: 'Jazz Club',
            compensation: null,
            date: '2024-12-15T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: 'Music Hall',
            compensation: '',
            date: '2024-11-20T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify only paid gigs are counted
    await expect(page.getByTestId('total-earnings')).toHaveText('$500.00');
    await expect(page.getByTestId('average-earnings')).toHaveText('$500.00');
    await expect(page.getByText('From 1 gigs')).toBeVisible();
  });

  test('should calculate current month and year earnings', async ({ page }) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastYear = new Date(currentYear - 1, currentMonth, 1);

    // Mock gigs from different time periods
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'Current Month Gig',
            compensation: '300',
            date: new Date(currentYear, currentMonth, 15).toISOString()
          },
          {
            id: 2,
            venueName: 'Last Month Gig',
            compensation: '400',
            date: lastMonth.toISOString()
          },
          {
            id: 3,
            venueName: 'Last Year Gig',
            compensation: '500',
            date: lastYear.toISOString()
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify current period calculations
    await expect(page.getByTestId('current-month-earnings')).toHaveText('$300.00');
    await expect(page.getByTestId('current-year-earnings')).toHaveText('$300.00');
  });

  test('should display monthly breakdown', async ({ page }) => {
    // Mock gigs across multiple months
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'December Gig 1',
            compensation: '300',
            date: '2024-12-01T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: 'December Gig 2',
            compensation: '200',
            date: '2024-12-15T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: 'November Gig',
            compensation: '600',
            date: '2024-11-01T19:00:00.000Z'
          },
          {
            id: 4,
            venueName: 'October Gig',
            compensation: '400',
            date: '2024-10-01T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify monthly breakdown is displayed
    await expect(page.getByText('Monthly Earnings')).toBeVisible();

    // Check specific months (adjust month format based on locale)
    await expect(page.getByTestId('month-2024-12')).toBeVisible();
    await expect(page.getByTestId('month-2024-11')).toBeVisible();
    await expect(page.getByTestId('month-2024-10')).toBeVisible();

    // Verify December shows 2 gigs and $500 total
    const decemberCard = page.getByTestId('month-2024-12');
    await expect(decemberCard).toBeVisible();
    await expect(decemberCard.getByText('$500.00')).toBeVisible();
    await expect(decemberCard.getByText('2 gigs')).toBeVisible();
    await expect(decemberCard.getByText('$250.00 avg')).toBeVisible();
  });

  test('should display yearly breakdown when multiple years exist', async ({ page }) => {
    // Mock gigs across multiple years
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: '2024 Gig 1',
            compensation: '1000',
            date: '2024-06-01T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: '2024 Gig 2',
            compensation: '1500',
            date: '2024-12-01T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: '2023 Gig',
            compensation: '800',
            date: '2023-06-01T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify yearly breakdown is displayed
    await expect(page.getByText('Yearly Earnings')).toBeVisible();

    // Check specific years
    await expect(page.getByTestId('year-2024')).toBeVisible();
    await expect(page.getByTestId('year-2023')).toBeVisible();

    // Verify 2024 shows correct totals
    const year2024Card = page.getByTestId('year-2024');
    await expect(year2024Card).toBeVisible();
    await expect(year2024Card.getByText('$2,500.00')).toBeVisible();
    await expect(year2024Card.getByText('2 gigs')).toBeVisible();
    await expect(year2024Card.getByText('$1,250.00 avg')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Mock delayed response
    await page.route('**/api/gigs', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify loading state is shown
    await expect(page.locator('.animate-pulse')).toBeVisible();

    // Wait for loading to complete
    await expect(page.getByTestId('earnings-empty')).toBeVisible();
  });

  test('should sort months chronologically (most recent first)', async ({ page }) => {
    // Mock gigs with unordered dates
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'January Gig',
            compensation: '100',
            date: '2024-01-01T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: 'March Gig',
            compensation: '300',
            date: '2024-03-01T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: 'February Gig',
            compensation: '200',
            date: '2024-02-01T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Get all month cards and verify order
    const monthCards = page.locator('[data-testid^="month-"]');
    const count = await monthCards.count();

    expect(count).toBe(3);

    // Verify order is March, February, January
    await expect(monthCards.nth(0)).toHaveTestId('month-2024-03');
    await expect(monthCards.nth(1)).toHaveTestId('month-2024-02');
    await expect(monthCards.nth(2)).toHaveTestId('month-2024-01');
  });

  test('should limit monthly breakdown to last 12 months', async ({ page }) => {
    // Mock gigs from more than 12 months ago
    const gigs = [];
    const now = new Date();

    // Create gigs for 15 months ago and current month
    for (let i = 0; i < 15; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      gigs.push({
        id: i + 1,
        venueName: `Gig ${i + 1}`,
        compensation: '100',
        date: date.toISOString()
      });
    }

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gigs)
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify only 12 months are shown
    const monthCards = page.locator('[data-testid^="month-"]');
    const count = await monthCards.count();

    expect(count).toBe(12);

    // Verify the oldest month shown is 12 months ago, not 15
    const thirteenMonthsAgo = new Date(now);
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
    const thirteenMonthsKey = `${thirteenMonthsAgo.getFullYear()}-${String(thirteenMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

    await expect(page.getByTestId(`month-${thirteenMonthsKey}`)).not.toBeVisible();
  });

  test('should format currency with proper locale', async ({ page }) => {
    // Mock gig with large compensation amount
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'High Payer',
            compensation: '1234567.89',
            date: '2024-12-01T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-earnings').click();

    // Verify proper currency formatting
    await expect(page.getByTestId('total-earnings')).toHaveText('$1,234,567.89');
  });
});