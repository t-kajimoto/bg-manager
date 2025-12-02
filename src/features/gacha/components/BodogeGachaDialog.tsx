import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Slider,
  Autocomplete,
  Chip,
  Box,
  Typography,
  FormControl,
  FormLabel
} from '@mui/material';

export interface GachaCondition {
  players: number | null;
  playStatus: 'played' | 'unplayed' | 'any';
  tags: string[];
  timeRange: number[];
  ratingRange: number[];
}

interface BodogeGachaDialogProps {
  open: boolean;
  onClose: (condition?: GachaCondition) => void;
  allTags: string[];
}

export const BodogeGachaDialog = ({ open, onClose, allTags }: BodogeGachaDialogProps) => {
  const [players, setPlayers] = useState<number | null>(null);
  const [playStatus, setPlayStatus] = useState<'played' | 'unplayed' | 'any'>('any');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<number[]>([0, 180]);
  const [ratingRange, setRatingRange] = useState<number[]>([0, 5]);

  const handleGacha = () => {
    onClose({
      players,
      playStatus,
      tags: selectedTags,
      timeRange,
      ratingRange
    });
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>ボドゲガチャ</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="プレイ人数"
            type="number"
            value={players || ''}
            onChange={(e) => setPlayers(e.target.value ? parseInt(e.target.value, 10) : null)}
            fullWidth
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">プレイ状況</FormLabel>
            <RadioGroup
              row
              value={playStatus}
              onChange={(e) => setPlayStatus(e.target.value as any)}
            >
              <FormControlLabel value="any" control={<Radio />} label="指定なし" />
              <FormControlLabel value="played" control={<Radio />} label="プレイ済" />
              <FormControlLabel value="unplayed" control={<Radio />} label="未プレイ" />
            </RadioGroup>
          </FormControl>

          <Autocomplete
            multiple
            options={allTags}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="タグ" placeholder="タグを選択" />
            )}
          />

          <Box>
            <Typography gutterBottom>プレイ時間 (分): {timeRange[0]} - {timeRange[1]}</Typography>
            <Slider
              value={timeRange}
              onChange={(_, newValue) => setTimeRange(newValue as number[])}
              valueLabelDisplay="auto"
              min={0}
              max={180}
              step={5}
            />
          </Box>

          <Box>
            <Typography gutterBottom>平均評価: {ratingRange[0]} - {ratingRange[1]}</Typography>
            <Slider
              value={ratingRange}
              onChange={(_, newValue) => setRatingRange(newValue as number[])}
              valueLabelDisplay="auto"
              min={0}
              max={5}
              step={0.1}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>キャンセル</Button>
        <Button onClick={handleGacha} variant="contained" color="primary">
          ガチャ実行
        </Button>
      </DialogActions>
    </Dialog>
  );
};
