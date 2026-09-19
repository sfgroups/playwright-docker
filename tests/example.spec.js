import { test, expect } from '@playwright/test';

test.describe('Playwright Homepage Tests', () => {
  
  // This runs before each individual test
  test.beforeEach(async ({ page }) => {
    // Navigate to the target website
    await page.goto('https://playwright.dev/');
  });

  test('should verify the page title', async ({ page }) => {
    // Expect the page title to contain a specific substring
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('should navigate to the installation page when clicking Get Started', async ({ page }) => {
    // Locate the "Get started" link and click it
    await page.getByRole('link', { name: 'Get started' }).click();

    // Expect the URL to change to the introduction page
    await expect(page).toHaveURL(/.*intro/);

    // Expect a specific heading to be visible on the new page
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
