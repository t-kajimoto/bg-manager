import { searchBGGId, getBGGItemDetails } from './bgg_api';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  console.log('--- BGG API テスト開始 ---');

  const query = 'Catan';
  console.log(`「${query}」を検索します...`);
  const bggId = await searchBGGId(query);

  if (bggId) {
    console.log(`BGG IDが見つかりました: ${bggId}`);
    console.log('詳細情報を取得します...');

    const details = await getBGGItemDetails(bggId);
    if (details) {
      console.log('--- 取得結果 ---');
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log('詳細情報の取得に失敗しました。');
    }
  } else {
    console.log('BGG IDが見つかりませんでした。');
  }

  console.log('--- テスト完了 ---');
}

run();
