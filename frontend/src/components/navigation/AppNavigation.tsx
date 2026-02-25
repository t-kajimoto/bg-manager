'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

// =============================================================================
// レスポンシブナビゲーションコンポーネント
// M3 Window Size Classes に応じて Drawer / Rail / Bottom Nav を切り替える
// =============================================================================

/** ナビゲーション項目の定義 */
interface NavItem {
  /** 表示ラベル */
  label: string;
  /** アイコン */
  icon: React.ReactNode;
  /** 遷移先パス（nullの場合はダイアログ等の特殊アクション） */
  path: string | null;
  /** ログイン必須かどうか */
  requireAuth?: boolean;
  /** 特殊アクションID */
  actionId?: string;
}

// ナビゲーション項目リスト
const NAV_ITEMS: NavItem[] = [
  {
    label: 'ボードゲーム',
    icon: <SportsEsportsIcon />,
    path: '/',
  },
  {
    label: '戦績',
    icon: <EmojiEventsIcon />,
    path: '/matches',
  },
  {
    label: 'ユーザー',
    icon: <PeopleIcon />,
    path: '/users',
  },
  {
    label: 'ガチャ',
    icon: <CasinoIcon />,
    path: null,
    actionId: 'gacha',
  },
  {
    label: 'マイページ',
    icon: <PersonIcon />,
    path: '/mypage',
    requireAuth: true,
  },
];

/** ナビゲーションドロワーの幅 */
const DRAWER_WIDTH = 280;
/** ナビゲーションレールの幅 */
const RAIL_WIDTH = 80;

interface AppNavigationProps {
  /** ガチャダイアログを開くコールバック */
  onGachaClick?: () => void;
}

export function AppNavigation({ onGachaClick }: AppNavigationProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // M3 Window Size Classes に基づくレスポンシブ判定
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));  // < 600px
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-840px
  const isExpanded = useMediaQuery(theme.breakpoints.up('md'));   // >= 840px

  // 現在アクティブなナビアイテムのインデックス
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (!item.path) return false;
    if (item.path === '/') return pathname === '/';
    return pathname.startsWith(item.path);
  });

  /** ナビゲーション項目がクリックされた時の処理 */
  const handleNavClick = (item: NavItem) => {
    // ログイン必須の項目で未ログインの場合は何もしない
    if (item.requireAuth && !user) return;

    // 特殊アクション（ガチャ等）
    if (item.actionId === 'gacha' && onGachaClick) {
      onGachaClick();
      return;
    }

    // 通常のページ遷移
    if (item.path) {
      router.push(item.path);
    }
  };

  // =========================================================================
  // Compactレイアウト（< 600px）: Bottom Navigation
  // =========================================================================
  if (isCompact) {
    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={activeIndex}
          onChange={(_, newValue) => handleNavClick(NAV_ITEMS[newValue])}
          showLabels
          sx={{
            height: 80,
            backgroundColor: 'var(--md-sys-color-surface-container)',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '8px 0',
              color: 'var(--md-sys-color-on-surface-variant)',
              '&.Mui-selected': {
                color: 'var(--md-sys-color-on-secondary-container)',
              },
            },
            // M3のアクティブインジケーター（ピル型の背景）
            '& .Mui-selected .MuiBottomNavigationAction-label': {
              fontWeight: 700,
              fontSize: '0.75rem',
            },
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
              disabled={item.requireAuth && !user}
            />
          ))}
        </BottomNavigation>
      </Paper>
    );
  }

  // =========================================================================
  // Medium / Expanded レイアウト: Navigation Rail / Drawer
  // =========================================================================
  const drawerWidth = isExpanded ? DRAWER_WIDTH : RAIL_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'var(--md-sys-color-surface)',
          // ヘッダーの高さ分だけ上から余白を取る
          top: 64,
          height: 'calc(100% - 64px)',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {/* ロゴエリア（Expandedのみ） */}
      {isExpanded && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src="/icon.png"
            alt="HARIDICE"
            sx={{ width: 40, height: 40 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2D2D2D 0%, #E8593F 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            HARIDICE
          </Typography>
        </Box>
      )}

      {isExpanded && <Divider sx={{ mx: 2 }} />}

      {/* ナビゲーションリスト */}
      <List sx={{ px: isExpanded ? 1.5 : 0.5, pt: 1 }}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          const isDisabled = item.requireAuth && !user;

          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item)}
                disabled={isDisabled}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  justifyContent: isExpanded ? 'initial' : 'center',
                  px: isExpanded ? 2 : 1,
                  borderRadius: isExpanded ? '28px' : '16px',
                  mx: isExpanded ? 0 : 0.5,
                  // M3のアクティブインジケーター
                  '&.Mui-selected': {
                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                    '& .MuiListItemIcon-root': {
                      color: 'var(--md-sys-color-on-secondary-container)',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 700,
                      color: 'var(--md-sys-color-on-secondary-container)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isExpanded ? 40 : 'auto',
                    justifyContent: 'center',
                    color: isActive
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {/* Expandedの場合のみラベルテキストを表示 */}
                {isExpanded && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.1px',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH, RAIL_WIDTH, NAV_ITEMS };
