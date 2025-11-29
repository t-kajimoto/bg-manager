'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, Menu, MenuItem } from '@mui/material';
import { GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { EditNicknameDialog } from '@/components/EditNicknameDialog';

export default function Header() {
  const { user, customUser, loading, updateNickname } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openNicknameDialog, setOpenNicknameDialog] = useState(false);

  const handleLogin = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return;

    if (!auth) {
      console.error("Firebase Auth is not configured.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
        window.location.reload();
        return;
    }

    if (!auth) {
      console.error("Firebase Auth is not configured.");
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditNickname = () => {
    handleClose();
    setOpenNicknameDialog(true);
  };

  const handleSaveNickname = async (newNickname?: string) => {
    setOpenNicknameDialog(false);
    if (newNickname) {
      await updateNickname(newNickname);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          HARIDICE Next
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
              >
                {customUser?.nickname || user.displayName}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleEditNickname}>ニックネームを編集</MenuItem>
                <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={handleLogin}>
              Login with Google
            </Button>
          )}
        </Box>
      </Toolbar>
      <EditNicknameDialog
        open={openNicknameDialog}
        onClose={handleSaveNickname}
        currentNickname={customUser?.nickname || null}
      />
    </AppBar>
  );
}
