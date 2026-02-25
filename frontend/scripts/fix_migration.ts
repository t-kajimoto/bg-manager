import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';

const BOARDGAME_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// 直前の移行で使ったマッピング
// Firestore Uid -> Supabase Uid
const MISTAKE_USER_ID = '2ca536d0-6062-4dab-b303-472b2db67b3b'; // 梶本拓海さん
const CORRECT_USER_ID = 'ca94461d-dd93-4eb0-80d4-6e421916bc63'; // かえでさん

// 移行元 (Firestore上は前回と同じUidのデータを使用)
const SOURCE_FIRESTORE_UID = 'nsPr7XWcyhhJMi9ipeS6GoU5g9A2';

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

if (!admin.apps.length) {
  if (FIREBASE_KEY_PATH) {
    const resolvedPath = path.resolve(process.cwd(), FIREBASE_KEY_PATH);
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

const db = admin.firestore();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fixMigration() {
  console.log('--- 梶本拓海さんに入った評価データの削除開始 ---');
  // 1. まず誤って入った梶本拓海さんの `user_board_game_states` を全て削除する
  // (もし本人自身の正式な評価データが元々入っていた場合は消してしまうリスクがある点に注意が必要ですが、
  // 今回は「かえでさんに入れたかった全データが入ってしまった」という状況と仮定し、一括クリアします)
  const { error: deleteError } = await supabase
    .from('user_board_game_states')
    .delete()
    .eq('user_id', MISTAKE_USER_ID);

  if (deleteError) {
    console.error('削除中にエラーが発生しました:', deleteError.message);
    return;
  }
  console.log('梶本拓海さんの評価データを削除完了');

  console.log('\n--- かえでさんへの再移行開始 ---');

  // 2. Firestoreから該当ユーザーの評価データを再取得
  const ubgSnapshot = await db.collection('userBoardGames').get();
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const doc of ubgSnapshot.docs) {
    const data = doc.data();

    // かえでさんに紐付けるべきFirestoreデータのUidのみを処理
    if (data.userId === SOURCE_FIRESTORE_UID) {
      if (!data.boardGameId) continue;

      const supabaseBoardGameId = uuidv5(data.boardGameId, BOARDGAME_NAMESPACE);

      const stateData = {
        user_id: CORRECT_USER_ID,
        board_game_id: supabaseBoardGameId,
        evaluation:
          typeof data.evaluation === 'number' ? data.evaluation : null,
        played:
          typeof data.played === 'boolean'
            ? data.played
            : typeof data.playCount === 'number' && data.playCount > 0
              ? true
              : false,
      };

      // 挿入処理 (boardGame側でエラーになる可能性がある不正データは1件ずつ確認される)
      const { error } = await supabase
        .from('user_board_game_states')
        .upsert(stateData, { onConflict: 'user_id, board_game_id' });

      if (error) {
        // 外部キー制約エラー(不正データ)は想定内として無視
        if (!error.message.includes('violates foreign key constraint')) {
          console.error(`Error saving (doc: ${doc.id}):`, error.message);
        }
        errorCount++;
      } else {
        successCount++;
      }
    } else {
      skipCount++;
    }
  }

  console.log('\n--- 再移行完了 ---');
  console.log(`移行成功 (かえでさんへ): ${successCount} 件`);
  console.log(`外部キーエラー (不正なゲームID): ${errorCount} 件`);
  console.log(`スキップ (他ユーザーのデータ): ${skipCount} 件`);
}

fixMigration().catch(console.error);
