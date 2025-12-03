
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { IBoardGameData } from '@/features/boardgames/types';
import { useBoardgameManager } from '@/features/boardgames/hooks/useBoardgameManager';

/**
 * @interface AddBoardgameDialogProps
 * @description AddBoardgameDialogコンポーネントのプロパティの型定義。
 * @property {boolean} open - ダイアログが表示されているかどうか。
 * @property {() => void} onClose - ダイアログが閉じる時に呼び出される関数。
 */
interface AddBoardgameDialogProps {
  open: boolean;
  onClose: () => void;
}

// フォームの入力データの型定義。IBoardGameDataからIDを除外。
type BoardGameFormInput = Omit<IBoardGameData, 'id'>;

/**
 * @component AddBoardgameDialog
 * @description 新しいボードゲームを追加するためのフォームを持つダイアログコンポーネント。
 */
export const AddBoardgameDialog = ({ open, onClose }: AddBoardgameDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  // ボードゲーム管理フックを呼び出し
  const { addBoardgame, loading, error } = useBoardgameManager();

  // react-hook-formを初期化
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardGameFormInput>({
    defaultValues: {
      name: '',
      min: 2,
      max: 4,
      time: 30,
      tags: [],
      ownerName: '',
    },
  });

  /**
   * @function handleFormSubmit
   * @description フォームの送信処理。バリデーション成功後に実行される。
   * @param {BoardGameFormInput} data - フォームから送信されたデータ。
   */
  const handleFormSubmit: SubmitHandler<BoardGameFormInput> = async (data) => {
    // 数値型に変換
    const gameData = {
      ...data,
      min: Number(data.min),
      max: Number(data.max),
      time: Number(data.time),
    };
    await addBoardgame(gameData);
    // エラーがなければダイアログを閉じてフォームをリセット
    if (!error) {
      handleClose();
    }
  };

  /**
   * @function handleClose
   * @description ダイアログを閉じる処理。フォームをリセットしてからonCloseを呼び出す。
   */
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>新しいボードゲームを追加</DialogTitle>
      {/* handleSubmitでフォームの送信処理をラップ */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {/* ゲーム名入力フィールド */}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'ゲーム名は必須です' }}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="ゲーム名"
                type="text"
                fullWidth
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          {/* 最小人数入力フィールド */}
          <Controller
            name="min"
            control={control}
            rules={{ required: '最小人数は必須です', min: { value: 1, message: '1以上の数値を入力してください' } }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="dense"
                label="最小人数"
                type="number"
                fullWidth
                variant="outlined"
                error={!!errors.min}
                helperText={errors.min?.message}
              />
            )}
          />
          {/* 最大人数入力フィールド */}
          <Controller
            name="max"
            control={control}
            rules={{ required: '最大人数は必須です', min: { value: 1, message: '1以上の数値を入力してください' } }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="dense"
                label="最大人数"
                type="number"
                fullWidth
                variant="outlined"
                error={!!errors.max}
                helperText={errors.max?.message}
              />
            )}
          />
          {/* プレイ時間入力フィールド */}
          <Controller
            name="time"
            control={control}
            rules={{ required: 'プレイ時間は必須です', min: { value: 1, message: '1以上の数値を入力してください' } }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="dense"
                label="プレイ時間 (分)"
                type="number"
                fullWidth
                variant="outlined"
                error={!!errors.time}
                helperText={errors.time?.message}
              />
            )}
          />
          {/* TODO: タグと所有者名の入力フィールドを追加 */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            キャンセル
          </Button>
          <Button type="submit" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : '追加'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
