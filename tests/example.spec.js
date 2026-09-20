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


test('Search Wikipedia and verify content without manual waits', async ({ page }) => {
  // 1. Navigate to a real website
  await page.goto('https://wikipedia.org');

  // 2. Interact with the search input
  // Playwright automatically waits for the input to be ready
  const searchInput = page.getByLabel('Search Wikipedia');
  await searchInput.fill('Playwright (software)');

  // 3. Submit the search form by pressing Enter
  await searchInput.press('Enter');

  // 4. Verify the landing page URL and heading
  // Web assertions (expect().toHaveHeading) automatically retry until the condition passes
  await expect(page).toHaveURL(/.*Playwright_\(software\)/);
  
  const mainHeading = page.locator('#firstHeading');
  await expect(mainHeading).toHaveText('Playwright (software)');

  // 5. Click a link in the article body to navigate further
  // Playwright will wait for this link to appear on the new page before clicking
  await page.getByRole('link', { name: 'Microsoft', exact: true }).first().click();

  // 6. Final assertion on the new page
  await expect(page).toHaveURL(/.*Microsoft/);
});

test('Longer multi-step Wikipedia user journey', async ({ page }) => {
  // Step 1: Open Wikipedia homepage
  await page.goto('https://wikipedia.org');
  await expect(page).toHaveTitle(/Wikipedia/);

  // Step 2: First search for Automation
  const searchInput = page.getByLabel('Search Wikipedia');
  await searchInput.fill('Test automation');
  await searchInput.press('Enter');
  await expect(page.locator('#firstHeading')).toHaveText('Test automation');

  // Step 3: Navigate to the Software Testing page via article link
  await page.getByRole('link', { name: 'Software testing', exact: true }).first().click();
  await expect(page.locator('#firstHeading')).toHaveText('Software testing');

  // Step 4: Use the internal sidebar or search bar to look up something else
  const topSearch = page.getByRole('searchbox', { name: 'Search Wikipedia' });
  await topSearch.fill('Playwright (software)');
  await topSearch.press('Enter');
  await expect(page.locator('#firstHeading')).toHaveText('Playwright (software)');

  // Step 5: Click through to Microsoft
  await page.getByRole('link', { name: 'Microsoft', exact: true }).first().click();
  await expect(page.locator('#firstHeading')).toHaveText('Microsoft');

  // Step 6: Go to the talk page or history tab to add more interactions
  await page.getByRole('link', { name: 'View history', exact: true }).click();
  await expect(page).toHaveURL(/.*action=history/);
});