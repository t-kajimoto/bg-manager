import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
  console.error(
    'Missing env vars: SUPABASE_URL, SUPABASE_KEY, or GOOGLE_GENERATIVE_AI_API_KEY',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Googleグラウンディングを用いた検索と生成
const genAI = new GoogleGenerativeAI(API_KEY);
// @ts-ignore: Depending on SDK version, googleSearch may not be officially typed, but works on backend
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [{ googleSearch: {} }],
});

async function run() {
  console.log('--- 空の説明文の検索・要約・更新を開始します ---');
  // descriptionがnull、または空文字のゲームを取得
  const { data: games, error } = await supabase
    .from('board_games')
    .select('id, name, description')
    .or('description.is.null,description.eq.');

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('説明が空のボードゲームは見つかりませんでした。');
    return;
  }

  console.log(
    `合計 ${games.length} 件のボードゲームについて検索と生成を行います。`,
  );

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    console.log(
      `[${i + 1}/${games.length}] ${game.name} の情報を検索・生成中...`,
    );

    const prompt = `あなたは日本語のプロ編集者です。ボードゲーム「${game.name}」についてインターネットで検索し、そのゲームの目的と面白いポイントを含めて説明文を作成してください。

    【厳守ルール】
    1. 文字数は必ず【200文字以内】に収めること。
    2. ゲームの「目的」と「面白いポイント」が明確に伝わるようにすること。
    3. AIっぽさ（テンプレ感、記号過多、過剰な丁寧さ、結論から言うとなどの前置き、抽象語の空回り）を完全に消し、いきなり本文として自然に書き出すこと。
    4. 内容の捏造や、根拠のない数字・固有名詞の追加はしない。
    5. 「重要」「効果的」「最適」などの抽象語で押し切らず、「何がどうなるか」が伝わる具体的な表現にする。
    6. Markdown記法（太字、見出しなど）や、「」、()などの記号を多用しない。
    7. 出力は説明文の本文のみとし、余計な挨拶や補足等は一切出力しないこと。`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text && text.trim()) {
        const cleanText = text.trim();
        const { error: updateError } = await supabase
          .from('board_games')
          .update({ description: cleanText })
          .eq('id', game.id);

        if (updateError) {
          console.error(`[更新エラー] ${game.name}:`, updateError);
        } else {
          console.log(`[成功] ${game.name} (${cleanText.length}文字)`);
        }
      } else {
        console.log(`[失敗] ${game.name}: 応答が空でした。`);
      }
    } catch (e) {
      console.error(`[処理エラー] ${game.name}:`, e);
    }

    // レートリミット回避のため少し待機
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('--- 完了処理 ---');
}

run();
