import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';

const BOARDGAME_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const USER_ID_MAPPING: Record<string, string> = {
  nsPr7XWcyhhJMi9ipeS6GoU5g9A2: '2ca536d0-6062-4dab-b303-472b2db67b3b',
  Eugco1rv7ceVqdbBTJuEvCHJd7m2: 'c3b808ef-903e-45e8-8b79-eeeeb4ffa62a',
};

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

async function findMissingGames() {
  console.log('--- 未同期ボードゲームの調査を開始 ---');

  const ubgSnapshot = await db.collection('userBoardGames').get();
  const gameIdsToMigrate = new Set<string>();

  for (const doc of ubgSnapshot.docs) {
    const data = doc.data();
    if (USER_ID_MAPPING[data.userId]) {
      gameIdsToMigrate.add(data.boardGameId);
    }
  }

  console.log(
    `\n移行対象の評価データに含まれるユニークなボードゲーム数: ${gameIdsToMigrate.size}`,
  );

  const missingGames = [];
  const foundGames = [];

  // Supabaseに存在するか1件ずつ確認 (IN句の上限回避のため)
  for (const firestoreGameId of gameIdsToMigrate) {
    const supabaseGameId = uuidv5(firestoreGameId, BOARDGAME_NAMESPACE);

    const { data: game, error } = await supabase
      .from('board_games')
      .select('id, name')
      .eq('id', supabaseGameId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game:', error.message);
      continue;
    }

    if (!game) {
      // Supabaseに存在しない場合、Firestoreから元の名前を取得
      const gameDoc = await db
        .collection('boardGames')
        .doc(firestoreGameId)
        .get();
      if (gameDoc.exists) {
        missingGames.push(
          gameDoc.data()?.name || `Unknown (${firestoreGameId})`,
        );
      } else {
        missingGames.push(`Unknown Game ID: ${firestoreGameId}`);
      }
    } else {
      foundGames.push(game.name);
    }
  }

  console.log(`\n--- 調査結果 ---`);
  console.log(`Supabaseに同期済み: ${foundGames.length}件`);
  console.log(`未同期 (エラーになった原因): ${missingGames.length}件`);

  if (missingGames.length > 0) {
    console.log('\n▼ 未同期のボードゲーム一覧 ▼');
    missingGames.forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });
  }
}

findMissingGames().catch(console.error);
