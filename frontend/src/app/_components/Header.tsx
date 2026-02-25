'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

// =============================================================================
// Header コンポーネント
// M3 Top App Bar に準拠したヘッダー
// ブランドロゴ（ハリネズミアイコン）+ アプリ名 + ユーザーメニュー
// =============================================================================

export default function Header() {
  const { user, customUser, loading, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /** Google OAuth ログイン処理 */
  const handleLogin = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  /** ログアウト処理 */
  const handleLogout = async () => {
    await signOut();
    handleClose();
  };

  /** ユーザーメニューを開く */
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  /** ユーザーメニューを閉じる */
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        // M3 Top App Bar: surface色の背景、下線で区切り
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        zIndex: (t) => t.zIndex.drawer + 1, // Drawerの上に表示
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        {/* --- ブランドロゴ --- */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexGrow: 1,
            cursor: 'pointer',
          }}
          onClick={() => window.location.href = '/'}
        >
          {/* ハリネズミアイコン */}
          <Avatar
            src="/icon.png"
            alt="HARIDICE"
            sx={{
              width: 36,
              height: 36,
              // ほんのりshadowを付けてアイコンを浮かせる
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          />
          {/* アプリ名: HARI(黒) + DICE(オレンジ) でロゴと同じスタイル */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              letterSpacing: '1px',
              userSelect: 'none',
            }}
          >
            <Box component="span" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              HARI
            </Box>
            <Box component="span" sx={{ color: 'var(--md-sys-color-primary)' }}>
              DICE
            </Box>
          </Typography>
        </Box>

        {/* --- 右側: ユーザーエリア --- */}
        <Box>
          {loading ? (
            // ローディング中はスピナー表示
            <CircularProgress size={24} sx={{ color: 'var(--md-sys-color-primary)' }} />
          ) : user ? (
            <>
              {/* ログイン済み: アバターボタン + ドロップダウンメニュー */}
              <Button
                onClick={handleMenu}
                sx={{
                  textTransform: 'none',
                  borderRadius: 20,
                  px: { xs: 1, sm: 2 },
                  color: 'var(--md-sys-color-on-surface)',
                  '&:hover': {
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  },
                }}
              >
                {/* ユーザーアバター */}
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  alt={customUser?.displayName || user.user_metadata?.full_name}
                  sx={{
                    width: 32,
                    height: 32,
                    mr: { xs: 0, sm: 1 },
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    fontSize: '0.875rem',
                  }}
                >
                  {/* アバター画像がない場合はイニシャル表示 */}
                  {(customUser?.displayName || user.user_metadata?.full_name || '?').charAt(0)}
                </Avatar>
                {/* ユーザー名（モバイルでは非表示） */}
                {!isMobile && (
                  <Box component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {customUser?.displayName || customUser?.nickname || user.user_metadata?.full_name}
                    </Typography>
                    {customUser?.discriminator && (
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        #{customUser.discriminator}
                      </Typography>
                    )}
                  </Box>
                )}
              </Button>
              {/* ドロップダウンメニュー */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: '12px',
                      mt: 1,
                      minWidth: 180,
                      boxShadow: '0px 2px 6px 2px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.3)',
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => { handleClose(); window.location.href = '/mypage'; }}
                  sx={{ borderRadius: '8px', mx: 0.5, my: 0.25 }}
                >
                  マイページ
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  sx={{ borderRadius: '8px', mx: 0.5, my: 0.25, color: 'error.main' }}
                >
                  ログアウト
                </MenuItem>
              </Menu>
            </>
          ) : (
            // 未ログイン: ログインボタン
            <Button
              variant="contained"
              onClick={handleLogin}
              startIcon={<LoginIcon />}
              sx={{
                borderRadius: 20,
                px: { xs: 2, sm: 3 },
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}
            >
              {isMobile ? 'ログイン' : 'Googleでログイン'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
