'use client';

import { useState, useMemo } from 'react';
import { Box, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import Header from '@/app/_components/Header';
import { AppNavigation, DRAWER_WIDTH, RAIL_WIDTH } from '@/components/navigation/AppNavigation';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { BodogeGachaDialog, GachaCondition } from '@/features/gacha/components/BodogeGachaDialog';
import { GachaResultDialog } from '@/features/gacha/components/GachaResultDialog';
import { useBoardgames } from '@/features/boardgames/hooks/useBoardgames';
import { IBoardGame } from '@/features/boardgames/types';

// =============================================================================
// AppLayout: アプリケーション全体のレイアウト構造
// Header + Navigation (Drawer/Rail/BottomNav) + Main Content の3層構成
// ガチャ機能もここで管理し、どのページからでもアクセスできるようにする
// =============================================================================

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();

  // M3 Window Size Classes に基づくレスポンシブ判定
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));  // < 600px
  const isExpanded = useMediaQuery(theme.breakpoints.up('md'));   // >= 840px

  // ナビゲーションの幅に応じたメインコンテンツのマージン
  const navWidth = isCompact ? 0 : isExpanded ? DRAWER_WIDTH : RAIL_WIDTH;

  // --- ガチャ機能の状態管理 ---
  const [gachaDialogOpen, setGachaDialogOpen] = useState(false);
  const [gachaResultOpen, setGachaResultOpen] = useState(false);
  const [gachaResultGame, setGachaResultGame] = useState<IBoardGame | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // ガチャ用にボードゲームデータを取得（所持ゲームのみフィルタ用）
  const { boardGames } = useBoardgames();

  // ガチャ条件で使用する全タグリスト（所持ゲームのみ）
  const ownedGames = useMemo(() => boardGames.filter(g => g.isOwned), [boardGames]);
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    ownedGames.forEach(game => game.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [ownedGames]);

  /** ガチャ結果処理: 所持ゲームの中から条件にマッチするものをランダムで1つ選ぶ */
  const handleGachaResult = (condition?: GachaCondition) => {
    setGachaDialogOpen(false);
    if (!condition) return;

    // 所持ゲームのみを対象にフィルタリング
    const candidates = ownedGames.filter((game) => {
      if (condition.players !== null && (game.min > condition.players || game.max < condition.players)) return false;
      if (condition.playStatus === 'played' && !game.played) return false;
      if (condition.playStatus === 'unplayed' && game.played) return false;
      if (condition.tags.length > 0 && !condition.tags.some(tag => game.tags?.includes(tag))) return false;
      if (game.time < condition.timeRange[0] || game.time > condition.timeRange[1]) return false;
      const avgEval = game.averageEvaluation || 0;
      if (avgEval < condition.ratingRange[0] || avgEval > condition.ratingRange[1]) return false;
      return true;
    });

    if (candidates.length === 0) {
      setSnackbarMessage('条件に合う所持ゲームが見つかりませんでした');
      return;
    }

    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setGachaResultGame(candidates[randomIndex]);
    setGachaResultOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* --- Top App Bar --- */}
      <Header />

      {/* --- メインエリア（Navigation + Content） --- */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* ナビゲーション: ガチャボタンのクリックハンドラを接続 */}
        <AppNavigation onGachaClick={() => setGachaDialogOpen(true)} />

        {/* --- メインコンテンツ --- */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // ナビゲーションの幅分だけ左マージンを取る
            ml: `${navWidth}px`,
            // モバイルではBottom Navの高さ分だけ下パディング
            pb: isCompact ? '96px' : 0,
            // コンテンツの最小高さ（ヘッダー分を引く）
            minHeight: 'calc(100vh - 64px)',
            // M3のsurface背景色
            backgroundColor: 'var(--md-sys-color-surface)',
            // レスポンシブなパディング
            p: { xs: 2, sm: 3, md: 4 },
            // フェードインアニメーション
            animation: 'm3-fade-in 300ms cubic-bezier(0.2, 0, 0, 1) both',
            // ナビゲーション幅変更時のスムーズなトランジション
            transition: theme.transitions.create('margin-left', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {children}
        </Box>
      </Box>

      {/* --- ガチャ条件ダイアログ（全ページ共通） --- */}
      <BodogeGachaDialog
        open={gachaDialogOpen}
        onClose={handleGachaResult}
        allTags={allTags}
      />

      {/* --- ガチャ結果ダイアログ --- */}
      <GachaResultDialog
        open={gachaResultOpen}
        onClose={() => { setGachaResultOpen(false); setGachaResultGame(null); }}
        game={gachaResultGame}
      />

      {/* --- チュートリアルオーバーレイ --- */}
      <TutorialOverlay />

      {/* --- 通知Snackbar（ガチャ等） --- */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
}
