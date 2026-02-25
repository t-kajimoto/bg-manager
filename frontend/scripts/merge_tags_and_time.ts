import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('必要な環境変数 (Supabase / Gemini) が不足しています。');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function processBoardGames() {
  console.log('--- ボードゲームデータの一括処理を開始します ---');

  // Supabaseから全ボードゲーム情報を取得
  const { data: games, error } = await supabase
    .from('board_games')
    .select('id, name, tags, categories, mechanics');

  if (error || !games) {
    console.error('ボードゲームデータの取得に失敗しました:', error);
    return;
  }

  console.log(`取得件数: ${games.length} 件`);

  let updatedCount = 0;

  for (const game of games) {
    console.log(`\n処理中 [${game.name}]...`);

    const currentTags = Array.isArray(game.tags) ? [...game.tags] : [];
    const categories = Array.isArray(game.categories) ? game.categories : [];
    const mechanics = Array.isArray(game.mechanics) ? game.mechanics : [];

    // --- 2. カテゴリ・メカニクスのタグ化と翻訳 ---
    const wordsToTranslate = [...categories, ...mechanics].filter(
      (w) => w && w.trim() !== '',
    );

    // 重複を排除し、すでにタグとして存在していないものだけを抽出
    const uniqueWords = Array.from(new Set(wordsToTranslate)).filter(
      (word) => !currentTags.includes(word),
    );

    let newTags: string[] = [];

    if (uniqueWords.length > 0) {
      console.log(` 💬 翻訳対象: ${uniqueWords.join(', ')}`);

      const prompt = `
あなたは優秀なボードゲーム翻訳者です。
以下のボードゲームのカテゴリ（Category）およびメカニクス（Mechanic）の英単語リストを、自然な日本語の「タグ」に翻訳して返してください。
回答は、カンマ区切りの文字列のみを出力してください（例: "手札管理, ダイスロール, カードゲーム"）。
余計な説明や、マークダウン（\`\`\` など）は一切出力しないでください。

【単語リスト】
${uniqueWords.join(', ')}
`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        // カンマまたは改行で分割し、クリーンアップ
        const translatedArray = responseText
          .split(/[,、\n]+/)
          .map((s) => s.trim())
          .filter((s) => s && !s.startsWith('```') && s !== '');

        console.log(` 🇯🇵 翻訳結果: ${translatedArray.join(', ')}`);

        // 既存タグと結合して一意にする
        newTags = Array.from(new Set([...currentTags, ...translatedArray]));
      } catch (err) {
        console.error(` ❌ 翻訳エラー: ${err}`);
        // エラー時は英語のまま一応追加する
        newTags = Array.from(new Set([...currentTags, ...uniqueWords]));
      }
    } else {
      newTags = [...currentTags];
    }

    // --- 3. 更新の適用 ---
    // もし変更があったなら更新する
    const isTagsChanged =
      newTags.length !== currentTags.length ||
      !newTags.every((t, i) => t === currentTags[i]);

    if (isTagsChanged) {
      console.log(
        ` 🔼 DB更新中... (タグ数: ${currentTags.length} -> ${newTags.length})`,
      );
      const { error: updateError } = await supabase
        .from('board_games')
        .update({
          tags: newTags,
          categories: null, // 配列を空箱にするか null にするか。ここではUI側で使わないので消す方向で。
          mechanics: null,
        })
        .eq('id', game.id);

      if (updateError) {
        console.error(` ❌ 更新エラー [${game.name}]:`, updateError);
      } else {
        console.log(` ✅ 更新完了`);
        updatedCount++;
      }
    } else {
      console.log(` ➖ 変更なしスキップ`);
      // UIで使わせないため、念の為 categories/mechanics だけは消す
      if (categories.length > 0 || mechanics.length > 0) {
        await supabase
          .from('board_games')
          .update({ categories: null, mechanics: null })
          .eq('id', game.id);
      }
    }

    // リクエスト制限回避のための少しウェイト
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n--- 処理完了 ---`);
  console.log(`更新件数: ${updatedCount} / ${games.length}`);
}

processBoardGames().catch(console.error);
