
'use client';

import { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, CircularProgress } from '@mui/material';
import { IBoardGame, IBoardGameData } from '@/types/boardgame';
import { useBoardgameManager } from '@/hooks/useBoardgameManager';

interface EditBoardgameDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null; // 編集対象のゲームデータ
}

type BoardGameFormInput = Omit<IBoardGameData, 'id'>;

/**
 * @component EditBoardgameDialog
 * @description 既存のボードゲーム情報を編集するためのフォームを持つダイアログ。
 */
export const EditBoardgameDialog = ({ open, onClose, game }: EditBoardgameDialogProps) => {
  const { updateBoardgame, loading, error } = useBoardgameManager();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<BoardGameFormInput>();

  // game propが変更されたら(新しい編集対象が選択されたら)、フォームの値をリセット
  useEffect(() => {
    if (game) {
      reset({
        name: game.name,
        min: game.min,
        max: game.max,
        time: game.time,
        tags: game.tags || [],
        ownerName: game.ownerName || '',
      });
    }
  }, [game, reset]);

  const handleFormSubmit: SubmitHandler<BoardGameFormInput> = async (data) => {
    if (!game) return; // 対象のゲームがなければ何もしない

    const gameData = {
      ...data,
      min: Number(data.min),
      max: Number(data.max),
      time: Number(data.time),
    };

    await updateBoardgame(game.id, gameData);
    if (!error) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ボードゲーム情報を編集</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {/* 各フォームフィールド (AddBoardgameDialogと同様) */}
          <Controller name="name" control={control} rules={{ required: 'ゲーム名は必須です' }}
            render={({ field }) => (
              <TextField {...field} autoFocus margin="dense" label="ゲーム名" type="text" fullWidth error={!!errors.name} helperText={errors.name?.message} />
            )}
          />
          <Controller name="min" control={control} rules={{ required: '最小人数は必須です', min: 1 }}
            render={({ field }) => (
              <TextField {...field} margin="dense" label="最小人数" type="number" fullWidth error={!!errors.min} helperText={errors.min?.message} />
            )}
          />
          <Controller name="max" control={control} rules={{ required: '最大人数は必須です', min: 1 }}
            render={({ field }) => (
              <TextField {...field} margin="dense" label="最大人数" type="number" fullWidth error={!!errors.max} helperText={errors.max?.message} />
            )}
          />
          <Controller name="time" control={control} rules={{ required: 'プレイ時間は必須です', min: 1 }}
            render={({ field }) => (
              <TextField {...field} margin="dense" label="プレイ時間 (分)" type="number" fullWidth error={!!errors.time} helperText={errors.time?.message} />
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
