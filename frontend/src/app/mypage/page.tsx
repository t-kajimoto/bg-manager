'use client';

import { useEffect, useState } from 'react';
import {
  Typography, Box, Tabs, Tab, CircularProgress,
  Avatar, Paper, Chip
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileTab } from '@/features/auth/components/ProfileTab';
import { BoardGameList } from '@/features/boardgames/components/BoardGameList';
import { useBoardgames } from '@/features/boardgames/hooks/useBoardgames';
import { MatchList } from '@/features/matches/components/MatchList';
import { MatchDialog } from '@/features/matches/components/MatchDialog';
import { IMatch } from '@/features/matches/types';

// =============================================================================
// マイページ
// M3準拠のプロフィールページ。ヘッダー画像 + アバター + タブ構成
// AppLayoutが提供するナビゲーションから遷移するため、独自Headerや戻るボタンは不要
// =============================================================================



export default function MyPage() {
  const { user, customUser, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<IMatch | null>(null);

  // ユーザー固有のボードゲームデータを取得
  const { boardGames, loading: gamesLoading, error: gamesError } = useBoardgames(user?.id);

  // 未ログインの場合のリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress sx={{ color: 'var(--md-sys-color-primary)' }} />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
      {/* --- プロフィールヘッダー --- */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          mb: 3,
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        {/* ヘッダー画像（ブランドアセットを活用） */}
        <Box
          sx={{
            height: { xs: 120, sm: 160 },
            background: 'linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-tertiary-container) 100%)',
            backgroundImage: 'url(/header.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        />

        {/* アバターエリア (ヘッダーに食い込ませる) */}
        <Box
          sx={{
            px: 3,
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Avatar
            src={user.user_metadata?.avatar_url}
            alt={customUser?.displayName}
            sx={{
              width: 80,
              height: 80,
              mt: -5,
              border: '4px solid var(--md-sys-color-surface)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontSize: '2rem',
            }}
          >
            {(customUser?.displayName || user.user_metadata?.full_name || '?').charAt(0)}
          </Avatar>
        </Box>

        {/* ユーザー情報エリア */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            mt: 1,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {customUser?.displayName || user.user_metadata?.full_name}
            </Typography>
            {customUser?.discriminator && (
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                #{customUser.discriminator}
              </Typography>
            )}
          </Box>
          {customUser?.bio && (
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.5 }}>
              {customUser.bio}
            </Typography>
          )}
          {customUser?.isAdmin && (
            <Chip label="管理者" size="small" color="primary" sx={{ mt: 1 }} />
          )}
        </Box>
      </Paper>

      {/* --- タブナビゲーション --- */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="fullWidth"
        sx={{
          mb: 3,
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          '& .MuiTab-root': {
            minHeight: 48,
          },
        }}
      >
        <Tab
          label="ボードゲーム"
          icon={<SportsEsportsIcon />}
          iconPosition="start"
          sx={{ fontWeight: tabValue === 0 ? 700 : 500 }}
        />
        <Tab
          label="戦績"
          icon={<EmojiEventsIcon />}
          iconPosition="start"
          sx={{ fontWeight: tabValue === 1 ? 700 : 500 }}
        />
        <Tab
          label="プロフィール"
          icon={<SettingsIcon />}
          iconPosition="start"
          sx={{ fontWeight: tabValue === 2 ? 700 : 500 }}
        />
      </Tabs>

      {/* --- タブコンテンツ --- */}
      <Box sx={{ animation: 'm3-fade-in 200ms cubic-bezier(0.2, 0, 0, 1) both' }}>
        {/* ボードゲームタブ: useBoardgamesフックで取得したデータを渡す */}
        {tabValue === 0 && (
          <BoardGameList
            games={boardGames}
            loading={gamesLoading}
            error={gamesError}
            onTagClick={() => {}}
            isEmptyResult={false}
            readOnly
          />
        )}

        {/* 戦績タブ */}
        {tabValue === 1 && (
          <Box>
            <MatchList
              userId={user.id}
              onEdit={(match) => { setEditingMatch(match); setMatchDialogOpen(true); }}
            />
            <MatchDialog
              open={matchDialogOpen}
              onClose={() => { setMatchDialogOpen(false); setEditingMatch(null); }}
              onSuccess={() => { setMatchDialogOpen(false); setEditingMatch(null); }}
              boardGames={boardGames}
              initialData={editingMatch || undefined}
              mode={editingMatch ? 'edit' : 'add'}
            />
          </Box>
        )}

        {/* プロフィールタブ */}
        {tabValue === 2 && (
          <ProfileTab />
        )}
      </Box>
    </Box>
  );
}
