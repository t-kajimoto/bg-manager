'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, ListItemAvatar, 
  Avatar, Button, Paper, IconButton, TextField, Alert,
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getFriendships, IFriendship, sendFriendRequest, respondToFriendRequest, getFriendshipsByUserId } from '@/app/actions/friends';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BaseDialog } from '@/components/ui/BaseDialog';

export const FriendList = ({ userId }: { userId?: string }) => {
  const { customUser, user: authUser } = useAuth();
  const currentUserId = authUser?.id;
  const isMe = !userId || userId === currentUserId;

  const [friendships, setFriendships] = useState<IFriendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchFriendships = async () => {
    setLoading(true);
    const { data } = userId && !isMe 
      ? await getFriendshipsByUserId(userId)
      : await getFriendships();
    if (data) setFriendships(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFriendships();
  }, []);

  const handleSendRequest = async () => {
    setAddLoading(true);
    setAddError(null);
    const { error } = await sendFriendRequest(targetUsername);
    if (error) {
      setAddError(error);
    } else {
      setOpenAddDialog(false);
      setTargetUsername('');
      fetchFriendships();
    }
    setAddLoading(false);
  };

  const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
    await respondToFriendRequest(id, status);
    fetchFriendships();
  };

  const friends = friendships.filter(f => f.status === 'accepted');
  const receivedRequests = isMe ? friendships.filter(f => f.status === 'pending' && f.receiver_id === currentUserId) : [];
  const sentRequests = isMe ? friendships.filter(f => f.status === 'pending' && f.sender_id === currentUserId) : [];

  if (loading) return <LoadingSpinner />;

  const addFriendActions = (
    <>
        <Button onClick={() => setOpenAddDialog(false)} color="inherit">キャンセル</Button>
        <Button 
        onClick={handleSendRequest} 
        variant="contained" 
        disabled={!targetUsername || addLoading}
        >
            {addLoading ? <CircularProgress size={24} color="inherit" /> : '申請を送る'}
        </Button>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">フレンド ({friends.length})</Typography>
        {isMe && (
          <Button 
              variant="contained" 
              startIcon={<PersonAddIcon />} 
              onClick={() => setOpenAddDialog(true)}
          >
            フレンド追加
          </Button>
        )}
      </Box>

      {receivedRequests.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle2" gutterBottom color="primary">届いている申請</Typography>
          <List dense>
            {receivedRequests.map((req) => (
              <ListItem 
                key={req.id}
                secondaryAction={
                    <Box>
                        <IconButton size="small" color="primary" onClick={() => handleResponse(req.id, 'accepted')}><CheckIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleResponse(req.id, 'rejected')}><CloseIcon /></IconButton>
                    </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar src={req.friend_profile.avatar_url || undefined} />
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <>{req.friend_profile.display_name}<Typography component="span" variant="body2" color="text.secondary">#{req.friend_profile.discriminator}</Typography></>
                  } 
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <List>
        {friends.length === 0 && <Typography color="text.secondary">フレンドはまだいません。</Typography>}
        {friends.map((friendship) => (
          <ListItem key={friendship.id} divider>
            <ListItemAvatar>
              <Avatar src={friendship.friend_profile.avatar_url || undefined} />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {friendship.friend_profile.display_name}
                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                        #{friendship.friend_profile.discriminator}
                    </Typography>
                </Box>
              } 
            />
          </ListItem>
        ))}
      </List>

      {sentRequests.length > 0 && (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">送信済みの申請</Typography>
            <List dense>
                {sentRequests.map((req) => (
                    <ListItem key={req.id}>
                        <ListItemText 
                            primary={
                                <>{req.friend_profile.display_name}<Typography component="span" variant="body2" color="text.secondary">#{req.friend_profile.discriminator}</Typography></>
                            } 
                            secondary="承認待ち..."
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
      )}

      <BaseDialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        title="フレンド申請"
        actions={addFriendActions}
        maxWidth="xs"
      >
          <Typography variant="body2" sx={{ mb: 2 }}>
              相手の「ユーザー名#1234」を入力してください。
          </Typography>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <TextField 
            label="名前#1234" 
            fullWidth 
            autoFocus 
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="ユーザー名#0000"
            disabled={addLoading}
          />
      </BaseDialog>
    </Box>
  );
};
