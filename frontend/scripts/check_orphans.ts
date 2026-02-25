import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const FIREBASE_KEY_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

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

async function checkOrphans() {
  console.log('--- 孤立データの詳細チェック ---');
  // カタン, 5IAxiAGkeIc6lgVTbIcf, #ポメマダ！ の評価データをいくつか拾ってみる
  const ubg = await db
    .collection('userBoardGames')
    .where('boardGameId', 'in', [
      'カタン',
      '5IAxiAGkeIc6lgVTbIcf',
      '#ポメマダ！',
      'ACQUIRE',
    ])
    .limit(10)
    .get();

  ubg.docs.forEach((d) => {
    const data = d.data();
    console.log(`Document ID: ${d.id}`);
    console.log(` - boardGameId: ${data.boardGameId}`);
    console.log(` - rating: ${data.rating}`);
    console.log(` - playCount: ${data.playCount}`);
    console.log(` - isOwned: ${data.isOwned}`);
    console.log('-------------------------');
  });
}

checkOrphans().catch(console.error);
