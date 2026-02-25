import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: games, error } = await supabase
    .from('board_games')
    .select('id, name, description')
    .or('description.is.null,description.eq.');

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('JSON_START[]');
    return;
  }

  console.log('JSON_START' + JSON.stringify(games));
}

run();
