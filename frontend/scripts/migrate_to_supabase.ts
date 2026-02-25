import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { searchBGGId, getBGGItemDetails, BGGGameDetails } from './bgg_api';

// UUIDv5生成用の名前空間 (適当なUUID)
const BOARDGAME_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

// --- 設定チェック ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 移行にはRLSをバイパスできるService Role Keyを推奨
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FIREBASE_KEY_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が設定されていません。',
  );
  process.exit(1);
}

// コマンドライン引数（--dry-run）のチェック
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('\n--- DRY RUN モード（DBへの書き込みは行われません） ---');
} else {
  console.log('\n--- 本番移行モード ---');
}

// --- Firebase Admin 初期化 ---
if (!admin.apps.length) {
  if (FIREBASE_KEY_PATH) {
    // サービスアカウントJSONファイルから初期化
    const resolvedPath = path.resolve(process.cwd(), FIREBASE_KEY_PATH);
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log(`Firebase Admin 初期化完了 (Key: ${FIREBASE_KEY_PATH})`);
  } else {
    // デフォルト（環境変数 `GOOGLE_APPLICATION_CREDENTIALS` 依存）
    console.log(
      'FIREBASE_SERVICE_ACCOUNT_PATH が未設定です。デフォルトの認証情報(GOOGLE_APPLICATION_CREDENTIALS)を使用します。',
    );
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin 初期化完了 (Default Credentials)');
    } catch (e: any) {
      console.error('Firebase Admin の初期化に失敗しました。', e.message);
      process.exit(1);
    }
  }
}

const db = admin.firestore();

// --- Supabase クライアント初期化 ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrateUsers() {
  console.log('\n--- ユーザー情報の移行を開始 ---');
  const usersSnapshot = await db.collection('users').get();
  console.log(`取得対象ユーザー数: ${usersSnapshot.size}`);

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const profileData = {
      id: doc.id, // Auth UID (UUID想定)
      full_name: data.displayName || null,
      username: data.displayName || null,
      avatar_url: data.photoURL || null,
      updated_at: new Date().toISOString(),
    };

    if (isDryRun) {
      console.log(
        `[DryRun] Profile: ${profileData.id} - ${profileData.full_name}`,
      );
    } else {
      const { error } = await supabase.from('profiles').upsert(profileData);
      if (error) {
        console.error(`Error upserting profile ${doc.id}:`, error.message);
      } else {
        console.log(`Profile upserted: ${doc.id}`);
      }
    }
  }
}

async function migrateBoardGames() {
  console.log('\n--- ボードゲーム情報の移行とBGG API連携を開始 ---');
  const gamesSnapshot = await db.collection('boardGames').get();
  console.log(`取得対象ゲーム数: ${gamesSnapshot.size}`);

  for (const doc of gamesSnapshot.docs) {
    const data = doc.data();
    const title = data.name;
    let bggDetails: BGGGameDetails | null = null;
    let bggId = data.bggId;

    const docId = doc.id;
    const supabaseUuid = uuidv5(docId, BOARDGAME_NAMESPACE);

    console.log(
      `\n処理中: ${title} (Firestore ID: ${docId} -> Supabase UUID: ${supabaseUuid})`,
    );

    // BGG情報の補完（IDがない場合は検索から）
    try {
      if (!bggId) {
        console.log(`  BGG IDの検索を試みます...`);
        bggId = await searchBGGId(title);
      }

      if (bggId) {
        console.log(`  BGG ID ${bggId} の詳細情報を取得します...`);
        bggDetails = await getBGGItemDetails(bggId);
      } else {
        console.log(`  BGG IDを特定できませんでした。`);
      }
    } catch (e) {
      console.warn(
        `  BGG API呼び出し中にエラーが発生しました（Cloudflareブロック等）。BGGデータなしで処理を継続します。`,
      );
    }

    // Supabase用データのマッピング
    const bgData: any = {
      id: supabaseUuid,
      name: title,
      min_players: bggDetails?.minPlayers || data.min || 1,
      max_players: bggDetails?.maxPlayers || data.max || 1,
      play_time_minutes: bggDetails?.playingTime || data.time || 0,
      min_playtime: bggDetails?.minPlayTime || null,
      max_playtime: bggDetails?.maxPlayTime || null,
      description: bggDetails?.description || data.description || null,
      year_published: bggDetails?.yearPublished || data.yearPublished || null,
      bgg_id: bggId || null,
      image_url: bggDetails?.imageUrl || data.imageUrl || null,
      thumbnail_url: bggDetails?.thumbnailUrl || data.thumbnailUrl || null,
      average_rating: bggDetails?.averageRating || null,
      complexity: bggDetails?.complexity || null,
      categories: bggDetails?.categories || data.tags || null,
      mechanics: bggDetails?.mechanics || null,
      designers: bggDetails?.designers || null,
      artists: bggDetails?.artists || null,
      publishers: bggDetails?.publishers || null,
      created_at: new Date().toISOString(),
    };

    if (isDryRun) {
      console.log(`[DryRun] BoardGame: ${bgData.name}`, JSON.stringify(bgData));
    } else {
      const { error } = await supabase.from('board_games').upsert(bgData);
      if (error) {
        console.error(`  Error upserting board_game ${doc.id}:`, error.message);
      } else {
        console.log(`  BoardGame upserted: ${doc.id}`);
      }
    }
  }
}

async function migrateUserBoardGames() {
  console.log('\n--- ユーザーのプレイ状況(userBoardGames)の移行を開始 ---');
  const ubgSnapshot = await db.collection('userBoardGames').get();
  console.log(`取得対象プレイ記録数: ${ubgSnapshot.size}`);

  for (const doc of ubgSnapshot.docs) {
    const data = doc.data();

    // Supabaseの `user_board_game_states` テーブル構造にマッピング
    const stateData = {
      user_id: data.userId,
      board_game_id: data.boardGameId,
      played: data.played || false,
      evaluation: data.evaluation || null,
      comment: data.comment || null,
      updated_at: new Date().toISOString(),
    };

    if (isDryRun) {
      console.log(
        `[DryRun] UserState: User:${stateData.user_id} - Game:${stateData.board_game_id}`,
      );
    } else {
      // ユーザーとゲームの複合条件でupsert
      const { error } = await supabase
        .from('user_board_game_states')
        .upsert(stateData, { onConflict: 'user_id, board_game_id' }); // 主キー設定に依存

      if (error) {
        console.error(
          `Error upserting user state (doc: ${doc.id}):`,
          error.message,
        );
      } else {
        console.log(`UserState upserted: ${doc.id}`);
      }
    }
  }
}

async function clearSupabaseData() {
  if (isDryRun) return;

  console.log(
    '既存のSupabaseテーブルのデータを全件削除します...（全テーブル対象）',
  );

  const { error: err1 } = await supabase
    .from('user_board_game_states')
    .delete()
    .neq('user_id', '00000000-0000-0000-0000-000000000000');
  if (err1) console.error('user_board_game_states の削除に失敗:', err1.message);
  else console.log('user_board_game_states のデータをクリアしました。');

  const { error: err2 } = await supabase
    .from('board_games')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (err2) console.error('board_games の削除に失敗:', err2.message);
  else console.log('board_games のデータをクリアしました。');

  const { error: err3 } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (err3) console.error('profiles の削除に失敗:', err3.message);
  else console.log('profiles のデータをクリアしました。');

  console.log('既存データのクリア完了。\n');
}

async function runMigration() {
  try {
    await clearSupabaseData();
    // ユーザー情報の移行は一時スキップ（Supabaseログイン後に評価データと共に移行するため）
    // await migrateUsers();
    await migrateBoardGames();
    // await migrateUserBoardGames();
    console.log('\n--- 移行処理が完了しました ---');
  } catch (error) {
    console.error('移行処理中に致命的なエラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
