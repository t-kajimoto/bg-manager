'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Button, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/contexts/AuthContext';
import Header from '../_components/Header';
import { ProfileTab } from '@/features/auth/components/ProfileTab';
import { BoardGameList } from '@/features/boardgames/components/BoardGameList';
import { MatchList } from '@/features/matches/components/MatchList';
import { FriendList } from '@/features/friends/components/FriendList';
import { useBoardGamePage } from '@/features/boardgames/hooks/useBoardGamePage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SettingsTab } from '@/features/auth/components/SettingsTab';

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { 
    boardGames, 
    loading: gamesLoading, 
    error: gamesError,
    handlers
  } = useBoardGamePage();
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  const handleTabChange = (_: any, newValue: number) => {
    setTabIndex(newValue);
  };

  const ownedGames = boardGames.filter(g => g.isOwned);

  return (
    <Box>
      <Header />
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href="/" passHref>
                <IconButton color="primary">
                    <ArrowBackIcon />
                </IconButton>
            </Link>
          <Typography variant="h4" component="h1">
            マイページ
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="プロフィール" />
            <Tab label="所持ボードゲーム" />
            <Tab label="戦績履歴" />
            <Tab label="フレンド" />
            <Tab label="設定" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {tabIndex === 0 && <ProfileTab />}
          
          {tabIndex === 1 && (
            <BoardGameList 
              games={ownedGames}
              loading={gamesLoading}
              error={gamesError}
              onEdit={handlers.handleEditClick}
              onDelete={handlers.handleDeleteClick}
              onEvaluation={handlers.handleEvaluationClick}
              onTagClick={handlers.handleTagClick}
              onAdd={() => handlers.refreshData()} // Dummy
              onClearFilter={() => {}}
              isEmptyResult={ownedGames.length === 0 && !gamesLoading}
            />
          )}

          {tabIndex === 2 && (
             <MatchList userId={user.id} />
          )}

          {tabIndex === 3 && <FriendList />}
          {tabIndex === 4 && <SettingsTab />}
        </Box>
      </Container>
    </Box>
  );
}
