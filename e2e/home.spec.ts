import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the board game list to load (look for a known mock item)
    await expect(page.getByText('Catan')).toBeVisible();
  });

  test('should display the correct title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/HARIDICE/);
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('should display mock board games', async ({ page }) => {
    await expect(page.getByText('Catan')).toBeVisible();
    await expect(page.getByText('Pandemic')).toBeVisible();
    await expect(page.getByText('Terraforming Mars')).toBeVisible();
  });

  test('should filter board games by search query', async ({ page }) => {
    // Search by typing into the search box
    const searchInput = page.getByRole('textbox', { name: '検索' });
    await searchInput.fill('Pandemic');

    // Should show Pandemic
    await expect(page.getByText('Pandemic')).toBeVisible();

    // Should hide Catan
    await expect(page.getByText('Catan')).not.toBeVisible();
  });

  test('should open gacha dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'ガチャ' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('ボドゲガチャ')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should filter by tag', async () => {
    // Placeholder for tag filtering test
    // Assuming implementation details might change or are complex
  });
});
