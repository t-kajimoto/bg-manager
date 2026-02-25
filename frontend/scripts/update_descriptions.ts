import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateDescriptions() {
  console.log('--- ボードゲーム説明文の翻訳・要約を開始します ---');

  // 全ボードゲームを取得
  const { data: games, error } = await supabase
    .from('board_games')
    .select('id, name, description');

  if (error) {
    console.error('Failed to fetch board games:', error);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('ボードゲームが見つかりません。');
    return;
  }

  console.log(
    `合計 ${games.length} 件のゲームが見つかりました。順次処理します...`,
  );

  let count = 0;
  for (const game of games) {
    if (!game.description) {
      console.log(`[スキップ] ${game.name}: 説明文がありません`);
      continue;
    }

    try {
      console.log(
        `[処理中 ${count + 1}/${games.length}] ${game.name} の要約を生成しています...`,
      );
      // 動的インポートにより、dotenvの読み込みを確実に行わせる
      const { translateText } = await import('../src/app/actions/translate');
      const translated = await translateText(game.description);

      if (translated && translated !== game.description) {
        // Supabaseを更新
        const { error: updateError } = await supabase
          .from('board_games')
          .update({ description: translated })
          .eq('id', game.id);

        if (updateError) {
          console.error(
            `[エラー] ${game.name} の更新に失敗しました:`,
            updateError,
          );
        } else {
          console.log(
            `[成功] ${game.name} の説明を更新しました (${translated.length}文字)`,
          );
        }
      } else {
        console.log(
          `[スキップ] ${game.name}: 翻訳結果が元のテキストと同じ、または失敗しました`,
        );
      }
    } catch (e) {
      console.error(`[エラー] ${game.name} の処理中に例外が発生しました:`, e);
    }

    count++;
    // APIのレート制限を考慮して少し待機
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('--- 全ての処理が完了しました ---');
}

updateDescriptions();
