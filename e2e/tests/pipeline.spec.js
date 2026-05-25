const { test, expect } = require('@playwright/test');

test.describe('Pipeline (Leads)', () => {
  test.use({ storageState: 'e2e/fixtures/auth.json' });

  test('displays pipeline columns', async ({ page }) => {
    await page.goto('/leads');
    await expect(page.getByText('Discovery')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Proposal')).toBeVisible();
    await expect(page.getByText('Negotiation')).toBeVisible();
    await expect(page.getByText('Closed Won')).toBeVisible();
    await expect(page.getByText('Lost')).toBeVisible();
  });

  test('opens add deal modal', async ({ page }) => {
    await page.goto('/leads');
    await page.getByText('Add Deal').click();
    await expect(page.getByText('Add New Deal')).toBeVisible();
    await expect(page.getByText('Create Deal')).toBeVisible();
  });

  test('closes add deal modal on cancel', async ({ page }) => {
    await page.goto('/leads');
    await page.getByText('Add Deal').click();
    await page.getByText('Cancel').first().click();
    await expect(page.getByText('Add New Deal')).not.toBeVisible();
  });
});
