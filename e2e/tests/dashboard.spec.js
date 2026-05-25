const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.use({ storageState: 'e2e/fixtures/auth.json' });

  test('displays dashboard metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pipeline Value').or(page.getByText('Active Deals'))).toBeVisible();
  });

  test('shows pipeline stages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Discovery').or(page.getByText('Pipeline Stages'))).toBeVisible({ timeout: 10000 });
  });

  test('shows follow-ups section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Follow-ups')).toBeVisible({ timeout: 10000 });
  });
});
