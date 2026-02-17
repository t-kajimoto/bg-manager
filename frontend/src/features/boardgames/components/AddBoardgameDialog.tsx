import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, CircularProgress, useTheme, useMediaQuery, Box, Alert, Autocomplete, debounce, Typography, Avatar, FormControlLabel, Checkbox, Chip } from '@mui/material';
import { addBoardGame } from '@/app/actions/boardgames';
import { searchBoardGame, getBoardGameDetails, BGGCandidate, BGGDetails } from '@/app/actions/bgg';

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
  mechanics: string;
  categories: string;
  averageRating: number;
  complexity: number;
};

export const AddBoardgameDialog = ({ open, onClose, onSuccess }: AddBoardgameDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autocomplete states
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<BGGCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Selected BGG Data
  const [selectedBGGDetails, setSelectedBGGDetails] = useState<BGGDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const {
    control,
    handleSubmit,
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
      mechanics: '',
      categories: '',
      averageRating: 0,
      complexity: 0,
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
      if (active && results) {
        setOptions(results);
      }
    });

    return () => {
      active = false;
    };
  }, [inputValue, searchBGG]);

  const handleFormSubmit: SubmitHandler<BoardGameFormInput> = async (data) => {
    setLoading(true);
    setErrorMessage(null);

    const gameData = {
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
        mechanics: data.mechanics.split(',').map(s => s.trim()).filter(Boolean),
        categories: data.categories.split(',').map(s => s.trim()).filter(Boolean),
        averageRating: Number(data.averageRating),
        complexity: Number(data.complexity),
        // Add BGG details if available (redundant but good for tracking)
        bggId: selectedBGGDetails?.id,
        imageUrl: selectedBGGDetails?.image,
        thumbnailUrl: selectedBGGDetails?.thumbnail,
    };

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

  const onGameSelected = async (option: BGGCandidate | string | null) => {
      // Clear details if selection is cleared or invalid
      if (!option) {
          setSelectedBGGDetails(null);
          return;
      }
      
      // If user typed a string (free text), we don't fetch BGG details
      // but we keep the name they typed.
      if (typeof option === 'string') {
          setSelectedBGGDetails(null);
          setValue('name', option);
          return;
      }

      // If user selected a BGG candidate
      setDetailsLoading(true);
      const details = await getBoardGameDetails(option.id);
      setDetailsLoading(false);

      if (details) {
          setSelectedBGGDetails(details);
          
          // Auto-populate fields
          if (details.name) setValue('name', details.name);
          if (details.minPlayers) setValue('min', details.minPlayers);
          if (details.maxPlayers) setValue('max', details.maxPlayers);
          if (details.playTime) setValue('time', details.playTime);
          if (details.minPlayTime) setValue('minPlayTime', details.minPlayTime);
          if (details.maxPlayTime) setValue('maxPlayTime', details.maxPlayTime);
          
          // Map BGG specific fields
          if (details.year) setValue('yearPublished', details.year);
          if (details.description) setValue('description', details.description);
          if (details.designers) setValue('designers', details.designers.join(', '));
          if (details.artists) setValue('artists', details.artists.join(', '));
          if (details.publishers) setValue('publishers', details.publishers.join(', '));
          if (details.mechanics) setValue('mechanics', details.mechanics.join(', '));
          if (details.categories) setValue('categories', details.categories.join(', '));
          if (details.averageRating) setValue('averageRating', details.averageRating);
          if (details.complexity) setValue('complexity', details.complexity);

          // Map mechanics and categories to tags
          const mechanics = details.mechanics || [];
          const categories = details.categories || [];
          const mergedTags = Array.from(new Set([...mechanics, ...categories])).slice(0, 10);
          setValue('tags', mergedTags);
      }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>新しいボードゲームを追加</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
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
                        onGameSelected(newValue);
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
                  options={[]}
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
                <TextField {...field} label="説明" multiline rows={3} fullWidth disabled={loading || !!selectedBGGDetails} />
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
              <Controller name="mechanics" control={control}
                render={({ field }) => (
                  <TextField {...field} label="メカニクス" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
              <Controller name="categories" control={control}
                render={({ field }) => (
                  <TextField {...field} label="カテゴリー" fullWidth disabled={loading || !!selectedBGGDetails} />
                )}
              />
            </Box>

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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>キャンセル</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : '追加'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
