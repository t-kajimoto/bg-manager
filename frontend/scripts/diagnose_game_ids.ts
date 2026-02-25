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

async function diagnoseConnections() {
  const ubgSnapshot = await db.collection('userBoardGames').get();
  const gameIdsInEvaluations = new Set<string>();

  ubgSnapshot.docs.forEach((doc) => {
    gameIdsInEvaluations.add(doc.data().boardGameId);
  });

  const bgSnapshot = await db.collection('boardGames').get();
  const gameIdsInBoardGames = new Set<string>();

  bgSnapshot.docs.forEach((doc) => {
    gameIdsInBoardGames.add(doc.id);
  });

  console.log(`Evaluations unique Game IDs: ${gameIdsInEvaluations.size}`);
  console.log(`BoardGames Collection IDs: ${gameIdsInBoardGames.size}`);

  let validCount = 0;
  let missingCount = 0;

  for (const evalGameId of gameIdsInEvaluations) {
    if (gameIdsInBoardGames.has(evalGameId)) {
      validCount++;
    } else {
      missingCount++;
      // let's print the first few
      if (missingCount <= 5) {
        console.log(`Missing ID in boardGames: ${evalGameId}`);
      }
    }
  }

  console.log(`Evaluations matching a real boardGame: ${validCount}`);
  console.log(`Evaluations with non-existent boardGameId: ${missingCount}`);
}

diagnoseConnections().catch(console.error);
