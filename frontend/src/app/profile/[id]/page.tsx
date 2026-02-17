'use client';

import { useEffect, useState, use } from 'react';
import { Container, Typography, Box, Tabs, Tab, Avatar, Paper, CircularProgress, IconButton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/_components/Header';
import { getProfileById } from '@/app/actions/profiles';
import { BoardGameList } from '@/features/boardgames/components/BoardGameList';
import { MatchList } from '@/features/matches/components/MatchList';
import { FriendList } from '@/features/friends/components/FriendList';
import { useBoardGamePage } from '@/features/boardgames/hooks/useBoardGamePage';
import { useRouter } from 'next/navigation';

/**
 * @component PublicProfilePage
 * @description 他のユーザーのプロフィールを表示する公開ページです。
 * 公開設定に基づいて情報の表示を制限します。
 */
export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // 被閲覧ユーザーのボードゲームデータ取得
  const { 
    boardGames, 
    loading: gamesLoading, 
    error: gamesError 
  } = useBoardGamePage(id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getProfileById(id);
        if (result.data) {
          // 自分のプロフィールの場合は、編集可能なマイページへ飛ばす
          if (result.isMe) {
            router.replace('/mypage');
            return;
          }
          setProfile(result.data);
          setIsFriend(result.isFriend);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, router]);

  if (loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">ユーザーが見つかりませんでした。</Alert>
          <Box sx={{ mt: 2 }}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        </Container>
      </Box>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  /**
   * プライバシー設定に基づいた表示可否の判定
   */
  const canSee = (visibility: string | undefined) => {
    if (visibility === 'public') return true;
    if (visibility === 'friends') return isFriend;
    return false;
  };

  const showGames = canSee(profile.visibility_games);
  const showMatches = canSee(profile.visibility_matches);
  const showFriends = canSee(profile.visibility_friends);

  const availableTabs = [
    { 
      label: '所持ゲーム', 
      visible: showGames, 
      component: (
        <BoardGameList 
          games={boardGames.filter(g => g.isOwned)}
          loading={gamesLoading}
          error={gamesError}
          readOnly
          isEmptyResult={boardGames.filter(g => g.isOwned).length === 0}
          onTagClick={(tag) => console.log('Tag clicked:', tag)} // 簡易的なハンドラ
        />
      )
    },
    { 
      label: '戦績履歴', 
      visible: showMatches, 
      component: <MatchList userId={id} /> 
    },
    { 
      label: 'フレンド', 
      visible: showFriends, 
      component: <FriendList userId={id} /> 
    },
  ].filter(t => t.visible);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>プロフィール</Typography>
        </Box>

        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
          {/* 装飾用背景 */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 100, 
            background: 'linear-gradient(45deg, #673ab7 30%, #2196f3 90%)',
            opacity: 0.1,
            zIndex: 0
          }} />
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 4, position: 'relative', zIndex: 1 }}>
            <Avatar 
              src={profile.avatar_url} 
              sx={{ 
                width: { xs: 120, md: 150 }, 
                height: { xs: 120, md: 150 },
                boxShadow: 3,
                border: '4px solid white'
              }} 
            />
            <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' }, pt: { sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '2.5rem' } }}>
                  {profile.display_name}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'light', opacity: 0.7 }}>
                  #{profile.discriminator}
                </Typography>
                {isFriend && (
                  <Paper sx={{ px: 1.5, py: 0.5, bgcolor: 'primary.50', display: 'inline-flex', alignItems: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>フレンド</Typography>
                  </Paper>
                )}
              </Box>
              
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', maxWidth: 600, mx: { xs: 'auto', sm: 0 } }}>
                {profile.bio || '自己紹介はありません'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {availableTabs.length > 0 ? (
          <Box sx={{ mt: 6 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                variant="scrollable"
                scrollButtons="auto"
              >
                {availableTabs.map((tab, idx) => (
                  <Tab key={idx} label={tab.label} sx={{ px: 3, fontWeight: 'medium' }} />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ mt: 2 }}>
              {availableTabs[tabIndex]?.component}
            </Box>
          </Box>
        ) : (
          <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 3, bgcolor: 'grey.50' }}>
            <Typography color="text.secondary">公開設定により、表示できる情報がありません。</Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
