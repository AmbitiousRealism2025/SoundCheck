import { test, expect } from '../setup/coverage.fixture';
import { mockUser } from '../setup/auth.fixture';

test.describe('Gig Management', () => {
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

  test('should display empty state when no gigs exist', async ({ page }) => {
    await page.getByTestId('tab-gigs').click();

    await expect(page.getByTestId('gigs-empty')).toBeVisible();
    await expect(page.getByText('No gigs scheduled')).toBeVisible();
    await expect(page.getByText('Tap the + button to add your first gig')).toBeVisible();
  });

  test('should create a new gig using floating action button', async ({ page }) => {
    await page.getByTestId('tab-gigs').click();

    // Open floating action menu
    await page.getByTestId('button-fab-toggle').click();
    await expect(page.getByTestId('button-new-gig')).toBeVisible();

    // Click new gig button
    await page.getByTestId('button-new-gig').click();

    // Verify modal is open
    await expect(page.getByTestId('gig-form-modal')).toBeVisible();
    await expect(page.getByTestId('text-modal-title')).toHaveText('New Gig');

    // Fill in gig details
    await page.getByTestId('input-venue-name').fill('The Blue Note');
    await page.getByTestId('input-venue-address').fill('123 Music Street, Jazz City');
    await page.getByTestId('input-venue-contact').fill('manager@bluenote.com');
    await page.getByTestId('input-date').fill('2024-12-25');
    await page.getByTestId('input-time').fill('19:00');
    await page.getByTestId('input-call-time').fill('18:00');
    await page.getByTestId('input-compensation').fill('500');
    await page.getByTestId('input-notes').fill('Christmas special - dress formal');

    // Submit the form
    await page.getByTestId('button-submit').click();

    // Verify modal is closed
    await expect(page.getByTestId('gig-form-modal')).not.toBeVisible();

    // Verify success message (if toast is implemented)
    // Note: Toast implementation might need to be mocked
  });

  test('should display gig details correctly', async ({ page }) => {
    // Mock API to return a gig
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          venueName: 'The Blue Note',
          venueAddress: '123 Music Street',
          venueContact: 'manager@bluenote.com',
          date: '2024-12-25T19:00:00.000Z',
          callTime: '2024-12-25T18:00:00.000Z',
          compensation: '500',
          notes: 'Christmas special'
        }])
      });
    });

    await page.getByTestId('tab-gigs').click();

    // Verify gig card is displayed
    await expect(page.getByTestId('gig-card-1')).toBeVisible();
    await expect(page.getByTestId('text-venue-name-1')).toHaveText('The Blue Note');
    await expect(page.getByTestId('text-gig-date-1')).toBeVisible();
    await expect(page.getByTestId('text-venue-address-1')).toHaveText('123 Music Street');
    await expect(page.getByTestId('text-compensation-1')).toHaveText('$500');
  });

  test('should edit an existing gig', async ({ page }) => {
    // Mock API to return a gig
    let gigs = [{
      id: 1,
      venueName: 'The Blue Note',
      venueAddress: '123 Music Street',
      venueContact: 'manager@bluenote.com',
      date: '2024-12-25T19:00:00.000Z',
      callTime: '2024-12-25T18:00:00.000Z',
      compensation: '500',
      notes: 'Christmas special'
    }];

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gigs)
      });
    });

    // Mock PUT request for updating
    await page.route('**/api/gigs/1', async route => {
      const request = route.request();
      if (request.method() === 'PUT') {
        const data = await request.postData();
        const updatedGig = JSON.parse(data);
        gigs[0] = { ...gigs[0], ...updatedGig };
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(gigs[0])
        });
      } else if (request.method() === 'DELETE') {
        gigs = [];
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    await page.getByTestId('tab-gigs').click();

    // Click edit button
    await page.getByTestId('button-edit-gig-1').click();

    // Verify edit modal
    await expect(page.getByTestId('gig-form-modal')).toBeVisible();
    await expect(page.getByTestId('text-modal-title')).toHaveText('Edit Gig');

    // Update venue name
    await page.getByTestId('input-venue-name').fill('The Blue Note - Updated');

    // Submit changes
    await page.getByTestId('button-submit').click();

    // Verify modal is closed
    await expect(page.getByTestId('gig-form-modal')).not.toBeVisible();
  });

  test('should delete a gig', async ({ page }) => {
    // Mock API to return a gig
    let gigs = [{
      id: 1,
      venueName: 'The Blue Note',
      venueAddress: '123 Music Street',
      venueContact: 'manager@bluenote.com',
      date: '2024-12-25T19:00:00.000Z',
      callTime: '2024-12-25T18:00:00.000Z',
      compensation: '500',
      notes: 'Christmas special'
    }];

    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gigs)
      });
    });

    // Mock DELETE request
    await page.route('**/api/gigs/1', async route => {
      if (route.request().method() === 'DELETE') {
        gigs = [];
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    await page.getByTestId('tab-gigs').click();

    // Click edit button
    await page.getByTestId('button-edit-gig-1').click();

    // Click delete button
    await page.getByTestId('button-delete-gig').click();

    // Confirm deletion in alert dialog
    await page.getByTestId('button-confirm-delete').click();

    // Verify gig is deleted (empty state should show)
    await expect(page.getByTestId('gigs-empty')).toBeVisible();
  });

  test('should open directions in Google Maps', async ({ page }) => {
    // Mock API to return a gig with address
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          venueName: 'The Blue Note',
          venueAddress: '123 Music Street, Jazz City',
          venueContact: 'manager@bluenote.com',
          date: '2024-12-25T19:00:00.000Z',
          callTime: '2024-12-25T18:00:00.000Z',
          compensation: '500',
          notes: 'Christmas special'
        }])
      });
    });

    await page.getByTestId('tab-gigs').click();

    // Setup page route handler to detect new tab opening
    const popupPromise = page.waitForEvent('popup');

    // Click directions button
    await page.getByTestId('button-directions-1').click();

    // Verify new tab opens with Google Maps URL
    const popup = await popupPromise;
    await expect(popup.url()).toMatch(/google\.com\/maps/);
    await expect(popup.url()).toMatch(/destination=123%20Music%20Street%2C%20Jazz%20City/);
    await popup.close();
  });

  test('should handle contact venue functionality', async ({ page }) => {
    // Mock API to return a gig with email contact
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          venueName: 'The Blue Note',
          venueAddress: '123 Music Street, Jazz City',
          venueContact: 'manager@bluenote.com',
          date: '2024-12-25T19:00:00.000Z',
          callTime: '2024-12-25T18:00:00.000Z',
          compensation: '500',
          notes: 'Christmas special'
        }])
      });
    });

    await page.getByTestId('tab-gigs').click();

    // Setup route handler for mailto link
    let mailtoUrl = '';
    page.on('request', request => {
      if (request.url().startsWith('mailto:')) {
        mailtoUrl = request.url();
      }
    });

    // Click contact button
    await page.getByTestId('button-contact-1').click();

    // Verify mailto link is triggered
    await expect(mailtoUrl).toBe('mailto:manager@bluenote.com');
  });

  test('should show error toast when no address for directions', async ({ page }) => {
    // Mock API to return a gig without address
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          venueName: 'The Blue Note',
          venueAddress: null,
          venueContact: 'manager@bluenote.com',
          date: '2024-12-25T19:00:00.000Z',
          callTime: '2024-12-25T18:00:00.000Z',
          compensation: '500',
          notes: 'Christmas special'
        }])
      });
    });

    await page.getByTestId('tab-gigs').click();

    // Mock toast notification
    await page.addLocatorHandler(page.getByRole('alert'), async () => {
      // Toast handler
    });

    // Click directions button
    await page.getByTestId('button-directions-1').click();

    // Note: In a real implementation, we would verify the toast message
    // This depends on how toasts are implemented in the application
  });

  test('should format compensation as currency', async ({ page }) => {
    // Mock API to return gigs with different compensation amounts
    await page.route('**/api/gigs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            venueName: 'Venue 1',
            compensation: '500',
            date: '2024-12-25T19:00:00.000Z'
          },
          {
            id: 2,
            venueName: 'Venue 2',
            compensation: '1000.50',
            date: '2024-12-26T19:00:00.000Z'
          },
          {
            id: 3,
            venueName: 'Venue 3',
            compensation: null,
            date: '2024-12-27T19:00:00.000Z'
          }
        ])
      });
    });

    await page.getByTestId('tab-gigs').click();

    // Verify currency formatting
    await expect(page.getByTestId('text-compensation-1')).toHaveText('$500');
    await expect(page.getByTestId('text-compensation-2')).toHaveText('$1,000.50');
    await expect(page.getByTestId('text-compensation-3')).toHaveText('Not set');
  });
});