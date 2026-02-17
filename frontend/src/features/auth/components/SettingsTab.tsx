'use client';

import { useState } from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Divider, Alert, CircularProgress } from '@mui/material';
import { useAuth, Visibility } from '@/contexts/AuthContext';

/**
 * @component SettingsTab
 * @description ユーザーの公開設定やアカウント情報を管理するタブコンポーネントです。
 */
export const SettingsTab = () => {
  const { customUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 公開設定の変更を保存します。
   */
  const handleVisibilityChange = async (key: string, value: Visibility) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({
        [key]: value
      });
      setSuccess(true);
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('設定の更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const settings = [
    { label: '所持ボードゲーム', key: 'visibilityGames', value: customUser?.visibilityGames },
    { label: '戦績履歴', key: 'visibilityMatches', value: customUser?.visibilityMatches },
    { label: 'フレンドリスト', key: 'visibilityFriends', value: customUser?.visibilityFriends },
    { label: 'ユーザー一覧への掲載', key: 'visibilityUserList', value: customUser?.visibilityUserList },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>アカウント情報</Typography>
        <Box sx={{ mb: 4, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            ログイン中のメールアドレス
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {customUser?.email}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>公開設定</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          各項目の情報を誰に見せるかを選択できます。
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>設定を更新しました。</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {settings.map((item) => (
            <FormControl fullWidth key={item.key}>
              <InputLabel id={`${item.key}-label`}>{item.label}</InputLabel>
              <Select
                labelId={`${item.key}-label`}
                value={item.value || 'public'}
                label={item.label}
                onChange={(e) => handleVisibilityChange(item.key, e.target.value as Visibility)}
                disabled={loading}
              >
                <MenuItem value="public">全体に公開</MenuItem>
                <MenuItem value="friends">フレンドのみ</MenuItem>
                <MenuItem value="private">非公開</MenuItem>
              </Select>
            </FormControl>
          ))}
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
