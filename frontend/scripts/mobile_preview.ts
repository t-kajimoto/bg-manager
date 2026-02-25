import { chromium, devices } from 'playwright';
import path from 'path';

(async () => {
  console.log('プレビュー用ブラウザを起動しています...');
  const browser = await chromium.launch();

  // iPhone 13 のデバイスパラメータをエミュレート
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();

  const targetUrl = 'http://localhost:3000';
  console.log(`${targetUrl} へアクセス中...`);

  try {
    await page.goto(targetUrl);
    // ネットワークリクエストが静かになる、またはタイムアウトするまで待機
    await page
      .waitForLoadState('networkidle', { timeout: 15000 })
      .catch(() => console.log('Network idle 待機タイムアウト'));

    // 少し待ってアニメーションや画像読み込みを安定させる
    await page.waitForTimeout(2000);

    const screenshotPath = path.resolve(
      process.cwd(),
      'mobile_preview_after.png',
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`スクリーンショットを保存しました: ${screenshotPath}`);
  } catch (error) {
    console.error('ページのロード中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();
