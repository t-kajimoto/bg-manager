
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { TextField, Button, CircularProgress, useTheme, useMediaQuery, Box, Alert, Autocomplete, Chip, FormControlLabel, Checkbox } from '@mui/material';
import { IBoardGame } from '@/features/boardgames/types';
import { updateBoardGame, getAllTags } from '@/app/actions/boardgames';
import { BaseDialog } from '@/components/ui/BaseDialog';

interface EditBoardgameDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null;
  onSuccess?: () => void; // リフレッシュ用
}

type BoardGameFormInput = {
  name: string;
  min: number;
  max: number;
  time: number;
  tags: string[];
  isOwned: boolean;
  minPlayTime: number;
  maxPlayTime: number;
  yearPublished: number;
  description: string;
  designers: string;
  artists: string;
  publishers: string;
  averageRating: number;
  complexity: number;
};

export const EditBoardgameDialog = ({ open, onClose, game, onSuccess }: EditBoardgameDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { control, handleSubmit, reset, formState: { errors } } = useForm<BoardGameFormInput>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Available tags for Autocomplete
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      getAllTags().then(res => {
        if (res.data) {
          setAvailableTags(res.data);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (game) {
      reset({
        name: game.name,
        min: game.min,
        max: game.max,
        time: game.time,
        tags: game.tags || [],
        isOwned: game.isOwned || false,
        minPlayTime: game.minPlayTime || 0,
        maxPlayTime: game.maxPlayTime || 0,
        yearPublished: game.yearPublished || new Date().getFullYear(),
        description: game.description || '',
        designers: game.designers?.join(', ') || '',
        artists: game.artists?.join(', ') || '',
        publishers: game.publishers?.join(', ') || '',
        averageRating: game.averageRating || 0,
        complexity: game.complexity || 0,
      });
    }
    setErrorMessage(null);
  }, [game, reset, open]);

  const handleFormSubmit: SubmitHandler<BoardGameFormInput> = async (data) => {
    if (!game) return;
    setLoading(true);
    setErrorMessage(null);

    const gameData = {
      id: game.id,
      name: data.name,
      min: Number(data.min),
      max: Number(data.max),
      time: Number(data.time),
      tags: data.tags,
      isOwned: data.isOwned,
      minPlayTime: Number(data.minPlayTime),
      maxPlayTime: Number(data.maxPlayTime),
      yearPublished: Number(data.yearPublished),
      description: data.description,
      designers: data.designers.split(',').map(s => s.trim()).filter(Boolean),
      artists: data.artists.split(',').map(s => s.trim()).filter(Boolean),
      publishers: data.publishers.split(',').map(s => s.trim()).filter(Boolean),
      averageRating: Number(data.averageRating),
      complexity: Number(data.complexity),
    };

    const result = await updateBoardGame(gameData);

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
      title="ボードゲーム情報を編集"
      actions={actionButtons}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          {errorMessage && (
             <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller name="name" control={control} rules={{ required: 'ゲーム名は必須です' }}
              render={({ field }) => (
                <TextField {...field} autoFocus label="ゲーム名" fullWidth error={!!errors.name} helperText={errors.name?.message} disabled={loading} />
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="min" control={control} rules={{ required: '必須', min: { value: 1, message: '1以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="最小人数" type="number" fullWidth error={!!errors.min} helperText={errors.min?.message} disabled={loading} />
                )}
              />
              <Controller name="max" control={control} rules={{ required: '必須', min: { value: 1, message: '1以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="最大人数" type="number" fullWidth error={!!errors.max} helperText={errors.max?.message} disabled={loading} />
                )}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="time" control={control} rules={{ required: '必須', min: { value: 0, message: '0以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="プレイ時間 (分)" type="number" fullWidth error={!!errors.time} helperText={errors.time?.message} disabled={loading} />
                )}
              />
               <Controller name="yearPublished" control={control}
                render={({ field }) => (
                  <TextField {...field} label="発行年" type="number" fullWidth disabled={loading} />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="minPlayTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="最小プレイ時間" type="number" fullWidth disabled={loading} />
                )}
              />
              <Controller name="maxPlayTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="最大プレイ時間" type="number" fullWidth disabled={loading} />
                )}
              />
            </Box>

            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={availableTags}
                  value={value || []}
                  onChange={(_, newValue) => onChange(newValue)}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        const { key, ...chipProps } = getTagProps({ index });
                        return <Chip label={option} {...chipProps} key={option} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="タグ" placeholder="Enterで追加" fullWidth disabled={loading} />
                  )}
                />
              )}
            />

            <Controller
              name="isOwned"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={<Checkbox checked={value} onChange={onChange} disabled={loading} />}
                  label="自分が所有している"
                />
              )}
            />

            <Controller name="description" control={control}
              render={({ field }) => (
                <TextField {...field} label="説明" multiline rows={3} fullWidth disabled={loading} />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="designers" control={control}
                render={({ field }) => (
                  <TextField {...field} label="デザイナー" fullWidth disabled={loading} />
                )}
              />
              <Controller name="artists" control={control}
                render={({ field }) => (
                  <TextField {...field} label="アーティスト" fullWidth disabled={loading} />
                )}
              />
            </Box>

            <Controller name="publishers" control={control}
              render={({ field }) => (
                <TextField {...field} label="パブリッシャー" fullWidth disabled={loading} />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="averageRating" control={control}
                render={({ field }) => (
                  <TextField {...field} label="BGG評価" type="number" fullWidth disabled={loading} inputProps={{ step: 0.1 }} />
                )}
              />
              <Controller name="complexity" control={control}
                render={({ field }) => (
                  <TextField {...field} label="重ゲー度" type="number" fullWidth disabled={loading} inputProps={{ step: 0.1 }} />
                )}
              />
            </Box>
          </Box>
      </form>
    </BaseDialog>
  );
};
