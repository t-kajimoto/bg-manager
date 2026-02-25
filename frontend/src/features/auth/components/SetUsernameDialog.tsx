'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box, CircularProgress, Alert, InputAdornment } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { generateDiscriminator } from '@/app/actions/profiles';

export const SetUsernameDialog = () => {
  const { customUser, user, updateProfile, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [discriminator, setDiscriminator] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ログイン済みかつ、プロフィール初期設定が完了していない場合に表示
    // isProfileSetupはAuthContextでdiscriminatorの有無から判定している
    if (!authLoading && user && customUser && !customUser.isProfileSetup) {
      setOpen(true);
      if (customUser?.nickname && !displayName) {
        setDisplayName(customUser.nickname);
      }
    } else {
      setOpen(false);
    }
  }, [authLoading, user, customUser, displayName]);

  const handleGenerateDiscriminator = async () => {
    if (!displayName) return;
    setLoading(true);
    setError(null);
    try {
      const disc = await generateDiscriminator(displayName);
      if (disc) {
        setDiscriminator(disc);
      } else {
        setError('識別番号の生成に失敗しました。名前を変えて試してください。');
      }
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!displayName || !discriminator) return;
    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        displayName,
        discriminator,
      });
      setOpen(false);
    } catch (err) {
      setError('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>プロフィール初期設定</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          このアプリで使用するユニークなユーザー名を設定してください。<br />
          [名前]#[4桁の数字] の形式で保存されます。
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="名前"
              fullWidth
              value={displayName}
              onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDiscriminator(''); // 名前を変えたらIDをリセット
              }}
              disabled={loading}
              placeholder="例: ボドゲ太郎"
            />
            <Typography variant="h5" sx={{ color: 'text.secondary', mt: 1 }}>#</Typography>
            <TextField
              label="ID"
              sx={{ width: 140 }}
              value={discriminator}
              onChange={(e) => setDiscriminator(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={loading}
              placeholder="1234"
              InputProps={{
                startAdornment: <InputAdornment position="start">#</InputAdornment>,
              }}
              inputProps={{ maxLength: 4 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
                variant="outlined" 
                size="small"
                onClick={handleGenerateDiscriminator} 
                disabled={loading || !displayName}
                sx={{ whiteSpace: 'nowrap' }}
            >
              番号を自動生成
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            ※表示名とIDは設定後、マイページからいつでも変更可能です。
          </Typography>

          {displayName && discriminator && (
            <Typography variant="h6" textAlign="center" sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              {displayName}<Box component="span" sx={{ color: 'text.secondary', fontWeight: 'light', ml: 0.5 }}>#{discriminator}</Box>
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !displayName || !discriminator}
            fullWidth
        >
          {loading ? <CircularProgress size={24} /> : '設定を完了する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
