const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByPlaceholderText('Enter username')).toBeVisible();
    await expect(page.getByPlaceholderText('Enter password')).toBeVisible();
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Sign In').click();
    await expect(page.getByText('Please enter both username and password.')).toBeVisible();
  });

  test('quick-fill admin and agent credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByText('admin').first().click();
    await expect(page.getByPlaceholderText('Enter username')).toHaveValue('admin');
    await expect(page.getByPlaceholderText('Enter password')).toHaveValue('admin123');

    await page.getByText('agent').click();
    await expect(page.getByPlaceholderText('Enter username')).toHaveValue('agent');
    await expect(page.getByPlaceholderText('Enter password')).toHaveValue('agent123');
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText('Enter username').fill('invalid');
    await page.getByPlaceholderText('Enter password').fill('invalid');
    await page.getByText('Sign In').click();
    await expect(page.getByText(/Invalid|failed|error/i)).toBeVisible({ timeout: 10000 });
  });
});
