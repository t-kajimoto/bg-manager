
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { TextField, Button, CircularProgress, Rating, Box, Alert } from '@mui/material';
import { IBoardGame } from '@/features/boardgames/types';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserGameState } from '@/app/actions/boardgames';
import { BaseDialog } from '@/components/ui/BaseDialog';

interface EditUserEvaluationDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null;
  onSuccess?: () => void;
}

type EvaluationFormInput = {
    evaluation: number;
    comment: string;
};

/**
 * @component EditUserEvaluationDialog
 * @description ユーザー自身の評価（星評価・コメント）を編集するためのダイアログ。
 */
export const EditUserEvaluationDialog = ({ open, onClose, game, onSuccess }: EditUserEvaluationDialogProps) => {
  const { user } = useAuth();
  const { control, handleSubmit, reset, setValue } = useForm<EvaluationFormInput>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (game) {
      reset({
        evaluation: game.evaluation,
        comment: game.comment,
      });
    }
    setErrorMessage(null);
  }, [game, reset, open]);

  const handleFormSubmit: SubmitHandler<EvaluationFormInput> = async (data) => {
    if (!game || !user) return;
    setLoading(true);
    setErrorMessage(null);

    // 評価が0より大きい場合、playedをtrueにする
    const played = data.evaluation > 0;

    const result = await updateUserGameState({
        boardGameId: game.id,
        played: played,
        evaluation: data.evaluation,
        comment: data.comment,
    });

    setLoading(false);

    if (result.error) {
        setErrorMessage('更新に失敗しました: ' + result.error);
    } else {
        if (onSuccess) onSuccess();
        onClose();
    }
  };

  const actionButtons = (
    <>
      <Button onClick={onClose} disabled={loading} color="inherit">キャンセル</Button>
      <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : '更新'}
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`${game?.name} の評価`}
      actions={actionButtons}
      maxWidth="xs"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
         <Box sx={{ textAlign: 'center' }}>
          {errorMessage && (
             <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{errorMessage}</Alert>
          )}
          <Box mb={2}>
            <Controller
              name="evaluation"
              control={control}
              render={({ field }) => (
                <Rating {...field} size="large" onChange={(e, newValue) => setValue('evaluation', newValue || 0)} disabled={loading} />
              )}
            />
          </Box>
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextField {...field} margin="dense" label="コメント" type="text" fullWidth multiline rows={2} disabled={loading} />
            )}
          />
        </Box>
      </form>
    </BaseDialog>
  );
};
