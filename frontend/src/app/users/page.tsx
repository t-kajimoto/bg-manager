'use client';

import { Box, Typography } from '@mui/material';
import { UserListTab } from '@/features/auth/components/UserListTab';

// =============================================================================
// ユーザー一覧ページ
// ナビゲーションから独立したユーザー一覧の専用ページ
// =============================================================================

export default function UsersPage() {
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
          👥 ユーザー
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          HARIDICEを使っているユーザーを探そう
        </Typography>
      </Box>

      {/* ユーザーリスト（既存のUserListTabコンポーネントを再利用） */}
      <UserListTab />
    </Box>
  );
}
