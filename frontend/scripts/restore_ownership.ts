import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('必要な環境変数 (Supabase) が不足しています。');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function restoreOwnership() {
  console.log('--- 古い評価データの所有情報を復元します ---');

  // user_board_game_states の全件を取得
  const { data: states, error } = await supabase
    .from('user_board_game_states')
    .select('user_id, board_game_id');

  if (error || !states) {
    console.error('データの取得に失敗しました:', error);
    return;
  }

  console.log(`取得件数: ${states.length} 件`);

  let count = 0;
  for (const state of states) {
    // owned_games に upsert
    const { error: upsertError } = await supabase
      .from('owned_games')
      .upsert(
        { user_id: state.user_id, board_game_id: state.board_game_id },
        { onConflict: 'user_id, board_game_id' },
      );

    if (upsertError) {
      console.error('Upsert failed:', upsertError);
    } else {
      count++;
    }
  }

  console.log(`復元完了: ${count} 件`);
}

restoreOwnership().catch(console.error);
