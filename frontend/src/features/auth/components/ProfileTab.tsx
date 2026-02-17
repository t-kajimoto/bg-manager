'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, Paper, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar } from '@/app/actions/profiles';

export const ProfileTab = () => {
  const { customUser, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(customUser?.displayName || '');
  const [discriminator, setDiscriminator] = useState(customUser?.discriminator || '');
  const [bio, setBio] = useState(customUser?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!displayName || !discriminator) {
      setError('表示名とIDを入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({
        displayName,
        discriminator,
        bio,
      });
      setSuccess(true);
    } catch (err) {
      setError('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadAvatar(formData);
      if (result.error) throw new Error(result.error);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('画像のアップロードに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              src={customUser?.photoURL} 
              sx={{ width: 80, height: 80 }} 
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="avatar-upload">
              <Tooltip title="画像を変更">
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.100' },
                    boxShadow: 1,
                  }}
                  size="small"
                  disabled={loading}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </label>
          </Box>
          <Box>
            <Typography variant="h5">
              {customUser?.displayName}
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 'light', ml: 0.5 }}>
                #{customUser?.discriminator}
              </Box>
            </Typography>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>プロフィールを更新しました。</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="表示名"
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
              <Typography variant="h5" sx={{ color: 'text.secondary' }}>#</Typography>
              <TextField
                label="ID"
                sx={{ width: 120 }}
                value={discriminator}
                onChange={(e) => setDiscriminator(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={loading}
                inputProps={{ maxLength: 4 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              ※表示名とIDは後からいつでも変更可能です。
            </Typography>
          </Box>
          <TextField
            label="自己紹介"
            fullWidth
            multiline
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
          />
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '変更を保存'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
