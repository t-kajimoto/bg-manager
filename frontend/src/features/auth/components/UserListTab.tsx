'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton, Paper, CircularProgress, Alert } from '@mui/material';
import { getProfiles, IProfile } from '@/app/actions/profiles';
import Link from 'next/link';

/**
 * @component UserListTab
 * @description アプリを利用しているユーザーの一覧を表示するコンポーネントです。
 */
export const UserListTab = () => {
  const [profiles, setProfiles] = useState<IProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error: fetchError } = await getProfiles();
        if (fetchError) throw new Error(fetchError);
        setProfiles(data || []);
      } catch (err) {
        setError('ユーザー一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (profiles.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">表示できるユーザーがいません。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Paper>
        <List>
          {profiles.map((profile, index) => (
            <Box key={profile.id}>
              <ListItem disablePadding>
                <Link href={`/profile/${profile.id}`} passHref style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar src={profile.avatar_url || undefined}>
                        {profile.display_name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {profile.display_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 'light' }}>
                            #{profile.discriminator}
                          </Typography>
                        </Box>
                      }
                      secondary={profile.bio || '自己紹介はありません'}
                      secondaryTypographyProps={{ 
                        noWrap: true, 
                        sx: { fontSize: '0.8rem' } 
                      }}
                    />
                  </ListItemButton>
                </Link>
              </ListItem>
              {index < profiles.length - 1 && <Box component="hr" sx={{ border: 0, borderTop: 1, borderColor: 'divider', m: 0 }} />}
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
