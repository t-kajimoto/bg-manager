import { XMLParser } from 'fast-xml-parser';

/**
 * 処理を指定ミリ秒待機する関数
 * @param ms 待機するミリ秒数
 * @returns 待機後に解決されるPromise
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * BGG APIから取得したボードゲームの詳細情報インターフェース
 */
export interface BGGGameDetails {
  bggId: string;
  name: string;
  description: string;
  yearPublished: number;
  minPlayers: number;
  maxPlayers: number;
  minPlayTime: number;
  maxPlayTime: number;
  playingTime: number;
  imageUrl: string;
  thumbnailUrl: string;
  averageRating: number;
  complexity: number;
  categories: string[];
  mechanics: string[];
  designers: string[];
  artists: string[];
  publishers: string[];
}

// fast-xml-parserのインスタンスを作成。属性をパースするように設定。
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * ボードゲーム名からBGG IDを検索する関数
 * @param query 検索するボードゲーム名
 * @returns 該当するボードゲームのBGG ID（見つからない場合はnull）
 */
export async function searchBGGId(query: string): Promise<string | null> {
  try {
    // レートリミット回避のため基本待機を2秒に増加
    await sleep(2000);

    const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
    console.log(`BGG検索実行: ${query} (URL: ${url})`);

    const headers: any = {
      'User-Agent': 'BGManagerMigration/1.0 (Contact: example@example.com)',
      Accept: 'text/xml, application/xml, */*',
    };
    if (process.env.BGG_API_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.BGG_API_TOKEN}`;
    }

    let response = await fetch(url, { headers });
    let retryCount = 0;

    // 429 Too Many Requestsの場合はリトライする
    while (response.status === 429 && retryCount < 3) {
      retryCount++;
      const waitTime = retryCount * 5000; // 5s, 10s, 15sと徐々に長く待機
      console.warn(
        `[API Limit] 429 Too Many Requests 返却。${waitTime / 1000}秒待機して再試行します...(${retryCount}/3)`,
      );
      await sleep(waitTime);
      response = await fetch(url, { headers });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textData = await response.text();

    // XMLをパースしてJSONオブジェクトに変換
    const result = parser.parse(textData);

    // レスポンスにデータが含まれない場合のチェック
    if (!result.items || !result.items.item) {
      console.log(`BGG検索: ${query} に一致する結果が見つかりませんでした。`);
      return null; // 見つからない場合
    }

    const items = result.items.item;
    // itemが配列で返ってくる場合と単一オブジェクトの場合があるため配列に正規化
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length > 0) {
      // 最も関連性の高い(最初の)アイテムのIDを返す
      const firstMatchId = itemsArray[0]['@_id'];
      console.log(`BGG ID取得成功: ${query} -> ${firstMatchId}`);
      return firstMatchId;
    }

    return null;
  } catch (error) {
    console.error('BGG検索中にエラーが発生しました:', error);
    return null;
  }
}

/**
 * BGG IDからボードゲームの詳細情報を取得する関数
 * @param bggId 取得対象のBGG ID
 * @returns BGGGameDetailsオブジェクト（取得失敗時はnull）
 */
export async function getBGGItemDetails(
  bggId: string,
): Promise<BGGGameDetails | null> {
  try {
    // 詳細API(Thing)の基本待機を3秒に増加
    await sleep(3000);

    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`;
    console.log(`BGG詳細情報取得実行: BGG ID ${bggId} (URL: ${url})`);

    const headers: any = {
      'User-Agent': 'BGManagerMigration/1.0 (Contact: example@example.com)',
      Accept: 'text/xml, application/xml, */*',
    };
    if (process.env.BGG_API_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.BGG_API_TOKEN}`;
    }

    let response = await fetch(url, { headers });
    let retryCount = 0;

    // 429 Too Many Requestsの場合はリトライ
    while (response.status === 429 && retryCount < 3) {
      retryCount++;
      const waitTime = retryCount * 5000;
      console.warn(
        `[API Limit] 429 Too Many Requests 返却。${waitTime / 1000}秒待機して再試行します...(${retryCount}/3)`,
      );
      await sleep(waitTime);
      response = await fetch(url, { headers });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textData = await response.text();

    // XMLをパースしてJSONオブジェクトに変換
    const result = parser.parse(textData);

    // データ構造の存在チェック
    if (!result.items || !result.items.item) {
      console.log(`BGG詳細情報: ID ${bggId} のデータが見つかりませんでした。`);
      return null;
    }

    const item = result.items.item;

    // 各項目の抽出。BGG APIはXMLのタグ名に従ってパースされるため、属性(@_valueなど)を参照する。
    // 値が存在しない場合のデフォルトフォールバックも用意。

    // 名前 (複数ある場合は primary のものを優先)
    let name = 'Unknown';
    if (item.name) {
      const names = Array.isArray(item.name) ? item.name : [item.name];
      const primaryName = names.find((n: any) => n['@_type'] === 'primary');
      name = primaryName ? primaryName['@_value'] : names[0]['@_value'];
    }

    // 各データ配列の抽出のためのヘルパー関数
    const extractLinks = (type: string) => {
      if (!item.link) return [];
      const links = Array.isArray(item.link) ? item.link : [item.link];
      return links
        .filter((l: any) => l['@_type'] === type)
        .map((l: any) => l['@_value']);
    };

    // 統計情報の抽出
    const stats = item.statistics?.ratings || {};

    // 情報を一つのオブジェクトにまとめて返す
    const details: BGGGameDetails = {
      bggId: bggId,
      name: name,
      description: item.description || '',
      yearPublished: parseInt(item.yearpublished?.['@_value'] || '0', 10),
      minPlayers: parseInt(item.minplayers?.['@_value'] || '0', 10),
      maxPlayers: parseInt(item.maxplayers?.['@_value'] || '0', 10),
      minPlayTime: parseInt(item.minplaytime?.['@_value'] || '0', 10),
      maxPlayTime: parseInt(item.maxplaytime?.['@_value'] || '0', 10),
      playingTime: parseInt(item.playingtime?.['@_value'] || '0', 10),
      imageUrl: item.image || '',
      thumbnailUrl: item.thumbnail || '',
      averageRating: parseFloat(stats.average?.['@_value'] || '0'),
      complexity: parseFloat(stats.averageweight?.['@_value'] || '0'),
      categories: extractLinks('boardgamecategory'),
      mechanics: extractLinks('boardgamemechanic'),
      designers: extractLinks('boardgamedesigner'),
      artists: extractLinks('boardgameartist'),
      publishers: extractLinks('boardgamepublisher'),
    };

    return details;
  } catch (error) {
    console.error(
      `BGG詳細情報の取得中にエラーが発生しました (ID: ${bggId}):`,
      error,
    );
    return null;
  }
}
