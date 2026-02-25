'use client';

import { useState } from 'react';
import { Box, Typography, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MatchList } from '@/features/matches/components/MatchList';
import { MatchDialog } from '@/features/matches/components/MatchDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useBoardgames } from '@/features/boardgames/hooks/useBoardgames';
import { IMatch } from '@/features/matches/types';

// =============================================================================
// 戦績ページ
// ナビゲーションから独立した戦績履歴の専用ページ
// =============================================================================

export default function MatchesPage() {
  const { customUser } = useAuth();
  const { boardGames } = useBoardgames();
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<IMatch | null>(null);

  /** 編集ボタンクリック: MatchDialogに選択中の戦績を渡す */
  const handleEdit = (match: IMatch) => {
    setEditingMatch(match);
    setMatchDialogOpen(true);
  };

  /** ダイアログを閉じてリロード */
  const handleClose = () => {
    setMatchDialogOpen(false);
    setEditingMatch(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          🏆 戦績履歴
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          プレイした記録を振り返ろう
        </Typography>
      </Box>

      {/* 戦績リスト */}
      <MatchList onEdit={customUser ? handleEdit : undefined} />

      {/* FAB: 戦績追加（ログイン時のみ） */}
      {customUser && (
        <Fab
          color="primary"
          aria-label="戦績を追加"
          onClick={() => { setEditingMatch(null); setMatchDialogOpen(true); }}
          sx={{
            position: 'fixed',
            zIndex: 1150,
            bottom: { xs: 'max(112px, calc(96px + env(safe-area-inset-bottom)))', sm: 24 },
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* 戦績追加/編集ダイアログ */}
      <MatchDialog
        open={matchDialogOpen}
        onClose={handleClose}
        onSuccess={handleClose}
        boardGames={boardGames}
        initialData={editingMatch || undefined}
        mode={editingMatch ? 'edit' : 'add'}
      />
    </Box>
  );
}
