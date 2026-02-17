import { test, expect } from '@playwright/test';

test.describe('Board Game Management (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Catan')).toBeVisible();
  });

  test('should open add board game dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: '追加' });

    if (await addButton.count() > 0) {
      await addButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /新しいボードゲームを追加/ })).toBeVisible();

      await page.getByRole('button', { name: 'キャンセル' }).click();
    }
  });

  test('should open edit dialog for a game', async ({ page }) => {
    // Find the card for Catan. It's inside a generic container that has heading "Catan".
    const card = page.locator('div').filter({
      has: page.getByRole('heading', { name: 'Catan' })
    }).filter({
      has: page.getByText('あなたの評価') // Ensure it's a card
    }).first();

    // Click the edit button within that card
    await card.getByRole('button', { name: '編集' }).first().click();

    // Now the edit dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check if game name input has value "Catan"
    await expect(page.getByLabel('ゲーム名')).toHaveValue('Catan');

    // Close it
    await page.getByRole('button', { name: 'キャンセル' }).click();
  });
});
