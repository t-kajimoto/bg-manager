import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

test.describe('Responsive Design', () => {
  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Wait for content to load
      await expect(page.locator('text=ボードゲーム一覧')).toBeVisible();

      // Open Gacha Dialog
      // Note: On mobile/tablet this should be full screen, on desktop it's a dialog.
      // The logical check is just that it opens and is visible.
      await page.getByRole('button', { name: 'ガチャ', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Close Dialog
      await page.getByRole('button', { name: 'キャンセル' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  }
});
