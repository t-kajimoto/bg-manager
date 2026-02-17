
'use client';

import { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, CircularProgress, Rating, Box } from '@mui/material';
import { IBoardGame, IBoardGameUser } from '@/features/boardgames/types';
import { useBoardgameManager } from '@/features/boardgames/hooks/useBoardgameManager';
import { useAuth } from '@/contexts/AuthContext';

interface EditUserEvaluationDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null;
}

/**
 * @component EditUserEvaluationDialog
 * @description ユーザー自身の評価（星評価・コメント）を編集するためのダイアログ。
 */
export const EditUserEvaluationDialog = ({ open, onClose, game }: EditUserEvaluationDialogProps) => {
  const { user } = useAuth();
  const { updateUserEvaluation, loading, error } = useBoardgameManager();
  const { control, handleSubmit, reset, setValue } = useForm<IBoardGameUser>();

  useEffect(() => {
    if (game) {
      reset({
        played: game.played,
        evaluation: game.evaluation,
        comment: game.comment,
      });
    }
  }, [game, reset]);

  const handleFormSubmit: SubmitHandler<IBoardGameUser> = async (data) => {
    if (!game || !user) return;

    // 評価が0より大きい場合、playedをtrueにする
    const evaluationData = {
      ...data,
      played: data.evaluation > 0,
    };

    await updateUserEvaluation(user.uid, game.id, evaluationData);
    if (!error) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{game?.name} の評価</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Box mb={2}>
            <Controller
              name="evaluation"
              control={control}
              render={({ field }) => (
                <Rating {...field} size="large" onChange={(e, newValue) => setValue('evaluation', newValue || 0)} />
              )}
            />
          </Box>
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextField {...field} margin="dense" label="コメント" type="text" fullWidth multiline rows={2} />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : '更新'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
