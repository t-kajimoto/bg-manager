import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';

// UUIDv5生成用の名前空間 (migrate_to_supabase.ts と同一)
const BOARDGAME_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// -- ユーザーIDマッピング --
// Firestore UID -> Supabase UUID
const USER_ID_MAPPING: Record<string, string> = {
  nsPr7XWcyhhJMi9ipeS6GoU5g9A2: '2ca536d0-6062-4dab-b303-472b2db67b3b',
  Eugco1rv7ceVqdbBTJuEvCHJd7m2: 'c3b808ef-903e-45e8-8b79-eeeeb4ffa62a',
};

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FIREBASE_KEY_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

// --- Firebase Admin 初期化 ---
if (!admin.apps.length) {
  if (FIREBASE_KEY_PATH) {
    const resolvedPath = path.resolve(process.cwd(), FIREBASE_KEY_PATH);
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log(`Firebase Admin 初期化完了 (Key: ${FIREBASE_KEY_PATH})`);
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin 初期化完了 (Default Credentials)');
  }
}

const db = admin.firestore();

// --- Supabase クライアント初期化 ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrateSpecificUserEvaluations() {
  console.log('\n--- ユーザー評価(userBoardGames)の選択的移行を開始 ---');

  // まず現在の user_board_game_states をクリアするかはユーザーの要望次第だが、
  // Upsertなので一旦そのまま進める。

  const ubgSnapshot = await db.collection('userBoardGames').get();
  console.log(`Firestoreの総プレイ記録数: ${ubgSnapshot.size}`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of ubgSnapshot.docs) {
    const data = doc.data();
    const firestoreUserId = data.userId;

    // マッピングに存在するユーザーのみ移行する
    const supabaseUserId = USER_ID_MAPPING[firestoreUserId];

    if (!supabaseUserId) {
      skippedCount++;
      continue;
    }

    // ボードゲームIDをUUIDv5に変換
    const supabaseBoardGameId = uuidv5(data.boardGameId, BOARDGAME_NAMESPACE);

    const stateData = {
      user_id: supabaseUserId,
      board_game_id: supabaseBoardGameId,
      played: data.played || false,
      evaluation: data.evaluation || null,
      comment: data.comment || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_board_game_states')
      .upsert(stateData, { onConflict: 'user_id, board_game_id' });

    if (error) {
      console.error(`Error upserting (doc: ${doc.id}):`, error.message);
    } else {
      migratedCount++;
      console.log(
        `Migrated: FirestoreUser=${firestoreUserId} -> SupabaseUser=${supabaseUserId}, Game=${data.boardGameId} -> ${supabaseBoardGameId}`,
      );
    }
  }

  console.log(`\n--- 移行完了 ---`);
  console.log(`移行成功: ${migratedCount} 件`);
  console.log(`スキップ (対象外ユーザー): ${skippedCount} 件`);
}

migrateSpecificUserEvaluations().catch(console.error);
