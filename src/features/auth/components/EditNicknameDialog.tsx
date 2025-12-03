import { useState } from 'react';
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
  // Use a key to force re-render when the dialog opens, resetting state
  // or use the pattern of syncing state from props during render (but that's complex here)
  // Simple approach: Controlled component logic or key-based reset in parent.
  // Since we are inside the component, let's use the pattern of "adjusting state during rendering"
  // or simply split the state initialization.
  // Actually, for a dialog, it's often better to initialize state when `open` becomes true.
  // But `useEffect` caused lint error.
  // We will use a state variable to track `open` prop changes to reset `nickname`.

  const [prevOpen, setPrevOpen] = useState(open);
  const [nickname, setNickname] = useState(currentNickname || '');

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setNickname(currentNickname || '');
    }
  }

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
