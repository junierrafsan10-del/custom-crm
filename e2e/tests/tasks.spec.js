const { test, expect } = require('@playwright/test');

test.describe('Tasks', () => {
  test.use({ storageState: 'e2e/fixtures/auth.json' });

  test('displays task list', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByText('Search tasks by title')).toBeVisible({ timeout: 10000 });
  });

  test('opens add task modal', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByText('Add Task').click();
    await expect(page.getByText('Create New Task')).toBeVisible();
    await expect(page.getByText('Create Task')).toBeVisible();
  });
});
