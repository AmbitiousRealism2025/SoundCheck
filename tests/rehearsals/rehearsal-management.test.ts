import { test, expect } from '../setup/coverage.fixture';

test('should create a new rehearsal', async ({ page }) => {
  // For this test, we would need to be authenticated
  // Since we can't easily authenticate in a test environment,
  // we'll simulate the authenticated state by going directly to the home page
  await page.goto('/');
  
  // Click the floating action button
  await page.getByTestId('button-fab-toggle').click();
  
  // Click the "New Rehearsal" button
  await page.getByTestId('button-new-rehearsal').click();
  
  // Check that the rehearsal form modal is visible
  await expect(page.getByTestId('rehearsal-form-modal')).toBeVisible();
  
  // Fill in the rehearsal form
  await page.getByTestId('input-event-name').fill('Jazz Trio Practice');
  await page.getByTestId('input-location').fill('Studio 5, Downtown');
  
  // Fill in date and time (using today's date)
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  await page.getByTestId('input-date').fill(dateString);
  await page.getByTestId('input-time').fill('18:00');
  
  // Submit the form
  await page.getByTestId('button-submit').click();
  
  // Check that the modal is closed
  await expect(page.getByTestId('rehearsal-form-modal')).not.toBeVisible();
  
  // Check that the rehearsal card is created with correct information
  await expect(page.getByTestId('rehearsal-card-')).toBeVisible(); // This would need the actual ID
  await expect(page.getByText('Jazz Trio Practice')).toBeVisible();
});

test('should edit an existing rehearsal', async ({ page }) => {
  await page.goto('/');
  
  // Click the floating action button
  await page.getByTestId('button-fab-toggle').click();
  
  // Click the "New Rehearsal" button
  await page.getByTestId('button-new-rehearsal').click();
  
  // Fill in the rehearsal form
  await page.getByTestId('input-event-name').fill('Jazz Trio Practice');
  await page.getByTestId('input-location').fill('Studio 5, Downtown');
  
  // Fill in date and time
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  await page.getByTestId('input-date').fill(dateString);
  await page.getByTestId('input-time').fill('18:00');
  
  // Submit the form
  await page.getByTestId('button-submit').click();
  
  // Find the rehearsal card and click edit button
  // Note: In a real test, we would need to get the actual ID of the created rehearsal
  await page.getByTestId('button-edit-rehearsal-').click(); // This would need the actual ID
  
  // Check that the rehearsal form modal is visible with edit title
  await expect(page.getByTestId('text-modal-title')).toHaveText('Edit Rehearsal');
  
  // Update the rehearsal information
  await page.getByTestId('input-event-name').fill('Updated Jazz Trio Practice');
  await page.getByTestId('input-location').fill('Studio 7, Uptown');
  
  // Submit the form
  await page.getByTestId('button-submit').click();
  
  // Check that the modal is closed
  await expect(page.getByTestId('rehearsal-form-modal')).not.toBeVisible();
  
  // Check that the rehearsal card is updated with new information
  await expect(page.getByText('Updated Jazz Trio Practice')).toBeVisible();
  await expect(page.getByText('Studio 7, Uptown')).toBeVisible();
});

test('should delete a rehearsal', async ({ page }) => {
  await page.goto('/');
  
  // Click the floating action button
  await page.getByTestId('button-fab-toggle').click();
  
  // Click the "New Rehearsal" button
  await page.getByTestId('button-new-rehearsal').click();
  
  // Fill in the rehearsal form
  await page.getByTestId('input-event-name').fill('Jazz Trio Practice to Delete');
  await page.getByTestId('input-location').fill('Studio 5, Downtown');
  
  // Fill in date and time
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  await page.getByTestId('input-date').fill(dateString);
  await page.getByTestId('input-time').fill('18:00');
  
  // Submit the form
  await page.getByTestId('button-submit').click();
  
  // Find the rehearsal card and click edit button
  // Note: In a real test, we would need to get the actual ID of the created rehearsal
  await page.getByTestId('button-edit-rehearsal-').click(); // This would need the actual ID
  
  // Click the delete button
  await page.getByTestId('button-delete-rehearsal').click();
  
  // Confirm deletion in the alert dialog
  await page.getByTestId('button-confirm-delete').click();
  
  // Check that the modal is closed
  await expect(page.getByTestId('rehearsal-form-modal')).not.toBeVisible();
  
  // Check that the rehearsal card is no longer visible
  await expect(page.getByText('Jazz Trio Practice to Delete')).not.toBeVisible();
});

test('should add a task to a rehearsal', async ({ page }) => {
  await page.goto('/');
  
  // Click the floating action button
  await page.getByTestId('button-fab-toggle').click();
  
  // Click the "New Rehearsal" button
  await page.getByTestId('button-new-rehearsal').click();
  
  // Fill in the rehearsal form
  await page.getByTestId('input-event-name').fill('Jazz Trio Practice');
  await page.getByTestId('input-location').fill('Studio 5, Downtown');
  
  // Fill in date and time
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  await page.getByTestId('input-date').fill(dateString);
  await page.getByTestId('input-time').fill('18:00');
  
  // Submit the form
  await page.getByTestId('button-submit').click();
  
  // Click the "Add Task" button for the rehearsal
  // Note: In a real test, we would need to get the actual ID of the created rehearsal
  await page.getByTestId('button-add-task-').click(); // This would need the actual ID
  
  // Fill in the task title
  await page.getByTestId('input-new-task-').fill('Practice saxophone solo'); // This would need the actual ID
  
  // Click the "Add" button
  await page.getByTestId('button-save-task-').click(); // This would need the actual ID
  
  // Check that the task is added to the rehearsal
  await expect(page.getByText('Practice saxophone solo')).toBeVisible();
});