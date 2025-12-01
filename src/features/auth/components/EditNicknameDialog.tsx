import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

interface EditNicknameDialogProps {
  open: boolean;
  onClose: (newNickname?: string) => void;
  currentNickname: string | null;
}

export const EditNicknameDialog = ({ open, onClose, currentNickname }: EditNicknameDialogProps) => {
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (open) {
      setNickname(currentNickname || '');
    }
  }, [open, currentNickname]);

  const handleSave = () => {
    onClose(nickname);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>ニックネームを編集</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="ニックネーム"
            fullWidth
            variant="outlined"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            inputProps={{ maxLength: 20 }}
            helperText={`${nickname.length}/20`}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={!nickname.trim()}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};
