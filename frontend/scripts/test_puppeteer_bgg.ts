import puppeteer from 'puppeteer';

async function testPuppeteerBgg() {
  console.log('Puppeteerを起動します...');
  const browser = await puppeteer.launch({
    headless: true, // バックグラウンド実行
  });

  try {
    const page = await browser.newPage();

    // User-Agentや言語設定をさらに偽装
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    const url =
      'https://boardgamegeek.com/xmlapi2/search?query=Catan&type=boardgame';
    console.log(`${url} へアクセスします...`);

    // ページへナビゲート
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

    if (response) {
      console.log(`ステータスコード: ${response.status()}`);
      // 成功時(200系)は内容を取得
      if (response.ok()) {
        const content = await page.content();
        console.log('取得成功。内容の先頭200文字:');
        console.log(content.substring(0, 200));
      } else {
        console.log('エラー応答がありました。');
      }
    }
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    await browser.close();
    console.log('ブラウザを終了しました。');
  }
}

testPuppeteerBgg();
