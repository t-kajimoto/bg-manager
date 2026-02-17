'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, Menu, MenuItem } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const { user, customUser, loading, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const supabase = createClient();

  const handleLogin = async () => {
    // Mock mode logic if needed, or remove if relying on Supabase Mock
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
     await signOut();
     handleClose();
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          HARIDICE
        </Typography>

        <Box>
          {loading ? (
            <CircularProgress color="inherit" size={24} />
          ) : user ? (
            <>
              <Button
                color="inherit"
                onClick={handleMenu}
                startIcon={<AccountCircle />}
                sx={{
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: { xs: 1, sm: 2 },
                  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                  '& .MuiButton-startIcon > *:first-of-type': { fontSize: { xs: 24, sm: 20 } }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {customUser?.displayName || customUser?.nickname || user.user_metadata.full_name}
                  {customUser?.discriminator && (
                    <Box component="span" sx={{ opacity: 0.7, ml: 0.5, fontSize: '0.8em' }}>
                      #{customUser.discriminator}
                    </Box>
                  )}
                </Box>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); window.location.href = '/mypage'; }}>マイページ</MenuItem>
                <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={handleLogin} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Login
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>
                 with Google
              </Box>
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
