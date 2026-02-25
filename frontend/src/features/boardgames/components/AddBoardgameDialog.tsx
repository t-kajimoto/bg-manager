import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { TextField, Button, CircularProgress, useTheme, useMediaQuery, Box, Alert, Autocomplete, debounce, Avatar, FormControlLabel, Checkbox, Chip } from '@mui/material';
import { addBoardGame, getAllTags } from '@/app/actions/boardgames';
import { searchBoardGame, getBoardGameDetails, BGGCandidate, BGGDetails } from '@/app/actions/bgg';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { translateText } from '@/app/actions/translate';

interface AddBoardgameDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
  bggId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
};

export const AddBoardgameDialog = ({ open, onClose, onSuccess }: AddBoardgameDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);

  // Autocomplete states
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<BGGCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Selected BGG Data (Still used for UI display like Avatar)
  const [selectedBGGDetails, setSelectedBGGDetails] = useState<BGGDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Available tags for Autocomplete
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BoardGameFormInput>({
    defaultValues: {
      name: '',
      min: 1,
      max: 1,
      time: 0,
      tags: [],
      isOwned: true,
      minPlayTime: 0,
      maxPlayTime: 0,
      yearPublished: new Date().getFullYear(),
      description: '',
      designers: '',
      artists: '',
      publishers: '',
      averageRating: 0,
      complexity: 0,
      bggId: '',
      imageUrl: '',
      thumbnailUrl: '',
    },
  });

  const searchBGG = useMemo(
    () =>
      debounce(async (request: { input: string }, callback: (results?: BGGCandidate[]) => void) => {
        setSearchLoading(true);
        const results = await searchBoardGame(request.input);
        setSearchLoading(false);
        callback(results);
      }, 1000),
    [],
  );

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }

    searchBGG({ input: inputValue }, (results?: BGGCandidate[]) => {
      // ...
    });

    return () => {
      active = false;
    };
  }, [inputValue, searchBGG]);

  // Fetch all existing tags when dialog opens
  useEffect(() => {
    if (open) {
      getAllTags().then(res => {
        if (res.data) {
          setAvailableTags(res.data);
        }
      });
    }
  }, [open]);

  const handleFormSubmit: SubmitHandler<BoardGameFormInput> = async (data) => {
    setLoading(true);
    setErrorMessage(null);

    const gameData = {
        name: data.name,
        min: Number(data.min) || 1,
        max: Number(data.max) || 1,
        time: Number(data.time) || 0,
        tags: data.tags,
        isOwned: data.isOwned,
        minPlayTime: Number(data.minPlayTime) || 0,
        maxPlayTime: Number(data.maxPlayTime) || 0,
        yearPublished: Number(data.yearPublished) || new Date().getFullYear(),
        description: data.description,
        designers: data.designers.split(',').map(s => s.trim()).filter(Boolean),
        artists: data.artists.split(',').map(s => s.trim()).filter(Boolean),
        publishers: data.publishers.split(',').map(s => s.trim()).filter(Boolean),
        averageRating: Number(data.averageRating) || 0,
        complexity: Number(data.complexity) || 0,
        bggId: data.bggId || selectedBGGDetails?.id,
        imageUrl: data.imageUrl || selectedBGGDetails?.image,
        thumbnailUrl: data.thumbnailUrl || selectedBGGDetails?.thumbnail,
    };
    console.log('AddBoardgameDialog: Submitting gameData:', gameData);

    const result = await addBoardGame(gameData);

    setLoading(false);
    if (result.error) {
      setErrorMessage('追加に失敗しました: ' + result.error);
    } else {
      if (onSuccess) onSuccess();
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage(null);
    setInputValue('');
    setOptions([]);
    setSelectedBGGDetails(null);
    onClose();
  };

  const actionButtons = (
    <>
      <Button onClick={handleClose} disabled={loading} color="inherit">キャンセル</Button>
      <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : '追加'}
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="新しいボードゲームを追加"
      actions={actionButtons}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          <input type="hidden" {...register('bggId')} />
          <input type="hidden" {...register('imageUrl')} />
          <input type="hidden" {...register('thumbnailUrl')} />
          {errorMessage && (
             <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {selectedBGGDetails?.thumbnail && (
                    <Avatar src={selectedBGGDetails.thumbnail} variant="rounded" sx={{ width: 56, height: 56 }} />
                )}
                <Controller
                name="name"
                control={control}
                rules={{ required: 'ゲーム名は必須です' }}
                render={({ field: { onChange, value, ...field } }) => (
                    <Autocomplete
                    {...field}
                    freeSolo
                    options={options}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      if (option.name) return `${option.name} ${option.year ? `(${option.year})` : ''}`;
                      return '';
                    }}
                    filterOptions={(x) => x}
                    fullWidth
                    value={value || ''}
                    onInputChange={(event, newInputValue) => {
                        setInputValue(newInputValue);
                        // For freeSolo, the input text IS the value.
                        onChange(newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        const val = typeof newValue === 'string' ? newValue : newValue?.name || '';
                        onChange(val);
                        setInputValue(val);
                        
                        if (newValue && typeof newValue !== 'string') {
                            setDetailsLoading(true);
                            getBoardGameDetails(newValue.id).then(async (details) => {
                                setDetailsLoading(false);
                                if (details) {
                                    console.log('BGG Details fetched:', details);
                                    setSelectedBGGDetails(details);
                                    
                                    // Use the name from details which prioritizes Japanese
                                    setValue('name', details.name); 
                                    setInputValue(details.name); 

                                    setValue('min', details.minPlayers || 1);
                                    setValue('max', details.maxPlayers || 1);
                                    setValue('time', details.playTime || 0);
                                    setValue('minPlayTime', details.minPlayTime || 0);
                                    setValue('maxPlayTime', details.maxPlayTime || 0);
                                    setValue('yearPublished', details.year || new Date().getFullYear());
                                    
                                    // Handle Description Translation
                                    if (details.description) {
                                      setIsTranslating(true);
                                      // Do not set English description initially as per user request
                                      try {
                                        const translated = await translateText(details.description);
                                        setValue('description', translated);
                                      } catch (e) {
                                        console.error('Translation failed', e);
                                        setValue('description', details.description); // Fallback to English only on error
                                      } finally {
                                        setIsTranslating(false);
                                      }
                                    } else {
                                        setValue('description', '');
                                    }

                                    setValue('designers', details.designers?.join(', ') || '');
                                    setValue('artists', details.artists?.join(', ') || '');
                                    setValue('publishers', details.publishers?.join(', ') || '');
                                    
                                    // BGGから取得したカテゴリやメカニクス（英語）を初期タグとして追加
                                    const bggCategories = details.categories || [];
                                    const bggMechanics = details.mechanics || [];
                                    const newTags = Array.from(new Set([...bggCategories, ...bggMechanics]));
                                    setValue('tags', newTags);

                                    setValue('averageRating', details.averageRating ? parseFloat(details.averageRating.toFixed(1)) : 0);
                                    setValue('complexity', details.complexity ? parseFloat(details.complexity.toFixed(1)) : 0);
                                    // Set hidden BGG fields
                                    setValue('bggId', String(details.id));
                                    setValue('imageUrl', details.image);
                                    setValue('thumbnailUrl', details.thumbnail);
                                }
                            });
                        } else {
                            setSelectedBGGDetails(null);
                            setValue('bggId', undefined);
                            setValue('imageUrl', undefined);
                            setValue('thumbnailUrl', undefined);
                            setValue('description', ''); 
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                        {...params}
                        label="ゲーム名 (BGG検索)"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={loading}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                            <>
                                {searchLoading || detailsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                            ),
                        }}
                        />
                    )}
                    renderOption={(props, option) => {
                        const { key, ...otherProps } = props as any;
                        return (
                          <li {...otherProps} key={option.id}>
                              {option.name} {option.year ? `(${option.year})` : ''}
                          </li>
                        );
                    }}
                    />
                )}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
               <Controller name="min" control={control} rules={{ required: '必須', min: { value: 1, message: '1以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="最小人数" type="number" fullWidth error={!!errors.min} helperText={errors.min?.message} disabled={loading || !!selectedBGGDetails} />
                )}
              />
              <Controller name="max" control={control} rules={{ required: '必須', min: { value: 1, message: '1以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="最大人数" type="number" fullWidth error={!!errors.max} helperText={errors.max?.message} disabled={loading || !!selectedBGGDetails} />
                )}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="time" control={control} rules={{ required: '必須', min: { value: 0, message: '0以上' } }}
                render={({ field }) => (
                  <TextField {...field} label="平均プレイ時間 (分)" type="number" fullWidth error={!!errors.time} helperText={errors.time?.message} disabled={loading || !!selectedBGGDetails} />
                )}
              />
              <Controller name="yearPublished" control={control}
                render={({ field }) => (
                  <TextField {...field} label="発行年" type="number" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="minPlayTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="最小プレイ時間" type="number" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
              <Controller name="maxPlayTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="最大プレイ時間" type="number" fullWidth disabled={loading || !!selectedBGGDetails} />
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
                <TextField 
                  {...field} 
                  label="説明" 
                  multiline 
                  rows={3} 
                  fullWidth 
                  disabled={loading} // Allow editing even if BGG details selected, but maybe user wants to edit translation
                  InputProps={{
                    endAdornment: isTranslating ? <CircularProgress size={20} /> : null
                  }}
                  helperText={isTranslating ? "AI翻訳中..." : ""}
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="designers" control={control}
                render={({ field }) => (
                  <TextField {...field} label="デザイナー" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
              <Controller name="artists" control={control}
                render={({ field }) => (
                  <TextField {...field} label="アーティスト" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
            </Box>

            <Controller name="publishers" control={control}
              render={({ field }) => (
                <TextField {...field} label="パブリッシャー" fullWidth disabled={loading || !!selectedBGGDetails} />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller name="averageRating" control={control}
                render={({ field }) => (
                  <TextField {...field} label="BGG評価" type="number" fullWidth disabled={loading || !!selectedBGGDetails} inputProps={{ step: 0.1 }} />
                )}
              />
              <Controller name="complexity" control={control}
                render={({ field }) => (
                  <TextField {...field} label="重ゲー度" type="number" fullWidth disabled={loading || !!selectedBGGDetails} inputProps={{ step: 0.1 }} />
                )}
              />
            </Box>
          </Box>
      </form>
    </BaseDialog>
  );
};
