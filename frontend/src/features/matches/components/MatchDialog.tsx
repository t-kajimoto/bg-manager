import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import { TextField, Button, CircularProgress, useTheme, useMediaQuery, Box, Alert, MenuItem, IconButton, Typography, Paper, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { IBoardGame } from '@/features/boardgames/types';
import { addMatch, updateMatch, uploadMatchImage } from '@/app/actions/boardgames';
import { getProfiles, Profile } from '@/app/actions/profiles';
import { useAuth } from '@/contexts/AuthContext';
import { IMatch } from '../types';
import { BaseDialog } from '@/components/ui/BaseDialog';

interface MatchDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  boardGames: IBoardGame[];
  initialData?: IMatch;
  mode: 'add' | 'edit';
}

type MatchFormInput = {
  boardGameId: string;
  date: string; // YYYY-MM-DD
  location: string;
  note: string;
  players: {
    playerName: string;
    userId?: string;
    score: string;
    rank: number;
    isWinner: boolean;
    role: string;
  }[];
};

export const MatchDialog = ({ open, onClose, onSuccess, boardGames, initialData, mode }: MatchDialogProps) => {
  const theme = useTheme();
  const { customUser, user: authUser } = useAuth();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MatchFormInput>({
    defaultValues: {
      boardGameId: '',
      date: getTodayDate(),
      location: '',
      note: '',
      players: [
          { playerName: '', userId: undefined, score: '0', rank: 1, isWinner: false, role: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'players',
  });

  // Initialize form when initialData or mode changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        boardGameId: initialData.boardGameId,
        date: initialData.date.toISOString().split('T')[0],
        location: initialData.location || '',
        note: initialData.note || '',
        players: initialData.players.map(p => ({
          playerName: p.player_name,
          userId: p.user_id || undefined,
          score: p.score || '0',
          rank: p.rank || 1,
          isWinner: p.is_winner || false,
          role: p.role || '',
        })),
      });
      setImagePreview(initialData.imageUrl || null);
    } else if (mode === 'add') {
      const baseName = customUser?.displayName || authUser?.user_metadata?.full_name || '自分';
      const defaultName = customUser?.discriminator ? `${baseName}#${customUser.discriminator}` : baseName;
      reset({
        boardGameId: '',
        date: getTodayDate(),
        location: '',
        note: '',
        players: [
          { playerName: defaultName, userId: authUser?.id, score: '0', rank: 1, isWinner: false, role: '' },
          { playerName: 'プレイヤー2', userId: undefined, score: '0', rank: 2, isWinner: false, role: '' }
        ],
      });
      setImagePreview(null);
      setSelectedImage(null);
    }
  }, [initialData, mode, reset, customUser, authUser]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await getProfiles();
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit: SubmitHandler<MatchFormInput> = async (data) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      let imageUrl: string | null = imagePreview;
      if (selectedImage) {
        const { publicUrl, error: uploadError } = await uploadMatchImage(selectedImage);
        if (uploadError) throw new Error(uploadError);
        imageUrl = publicUrl || null;
      }

      const matchData = {
        boardGameId: data.boardGameId,
        date: new Date(data.date),
        location: data.location,
        note: data.note,
        imageUrl: imageUrl || undefined,
      };

      let result;
      if (mode === 'add') {
        result = await addMatch(matchData, data.players);
      } else {
        if (!initialData?.id) throw new Error('Match ID is missing');
        result = await updateMatch(initialData.id, matchData, data.players);
      }

      if (result.error) {
        setErrorMessage('保存に失敗しました: ' + result.error);
      } else {
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (error: unknown) {
        setErrorMessage('エラーが発生しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage(null);
    setSelectedImage(null);
    setImagePreview(null);
    onClose();
  };

  const actionButtons = (
    <>
      <Button onClick={handleClose} disabled={loading} color="inherit">キャンセル</Button>
      <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={loading} autoFocus>
        {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'add' ? '記録' : '更新')}
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={mode === 'add' ? '戦績を記録' : '戦績を編集'}
      actions={actionButtons}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          {errorMessage && (
             <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="boardGameId"
              control={control}
              rules={{ required: 'ボードゲームを選択してください' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="ボードゲーム"
                  fullWidth
                  error={!!errors.boardGameId}
                  helperText={errors.boardGameId?.message}
                  disabled={loading}
                >
                  {boardGames.map((game) => (
                    <MenuItem key={game.id} value={game.id}>
                      {game.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            
            <Controller
              name="date"
              control={control}
              rules={{ required: '日付は必須です' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="日付"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  disabled={loading}
                />
              )}
            />

            <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="場所" fullWidth disabled={loading} />
                )}
            />

            <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>対戦写真</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        disabled={loading}
                    >
                        画像を選択
                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                    </Button>
                    {imagePreview && (
                        <Box
                            component="img"
                            src={imagePreview}
                            sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                        />
                    )}
                </Box>
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>プレイヤー</Typography>
            {fields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }} variant="outlined">
                    <Typography>{index + 1}.</Typography>
                    <Controller
                        name={`players.${index}.playerName`}
                        control={control}
                        rules={{ required: '名前は必須です' }}
                        render={({ field: { value, onChange } }) => (
                            <Autocomplete
                                freeSolo
                                options={profiles}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    return `${option.display_name}#${option.discriminator}`;
                                }}
                                value={value}
                                onChange={(_, newValue) => {
                                    let selectedName = '';
                                    if (typeof newValue === 'string') {
                                        selectedName = newValue;
                                    } else if (newValue) {
                                        // 選択時に即座に「表示名#ID」の形式をセットする
                                        selectedName = `${newValue.display_name}#${newValue.discriminator}`;
                                        setValue(`players.${index}.userId`, newValue.id);
                                    }
                                    onChange(selectedName);
                                }}
                                onInputChange={(_, newInputValue) => onChange(newInputValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="プレイヤー名" size="small" sx={{ width: 200 }} error={!!errors.players?.[index]?.playerName} />
                                )}
                            />
                        )}
                    />
                     <Controller
                        name={`players.${index}.score`}
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="スコア" size="small" sx={{ width: 100 }} />
                        )}
                    />
                    <Controller
                        name={`players.${index}.rank`}
                        control={control}
                        render={({ field }) => (
                             <TextField {...field} label="順位" type="number" size="small" sx={{ width: 70 }} />
                        )}
                    />
                    <IconButton onClick={() => remove(index)} color="error" disabled={fields.length <= 1}>
                        <DeleteIcon />
                    </IconButton>
                </Paper>
            ))}
            <Button startIcon={<AddIcon />} onClick={() => append({ playerName: '', userId: undefined, score: '0', rank: fields.length + 1, isWinner: false, role: '' })} variant="outlined">
                プレイヤーを追加
            </Button>

            <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="メモ" fullWidth multiline rows={3} disabled={loading} />
                )}
            />

          </Box>
      </form>
    </BaseDialog>
  );
};
