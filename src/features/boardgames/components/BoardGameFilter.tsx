'use client';

import { Box, TextField, InputAdornment, IconButton, MenuItem, Chip, Typography, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

interface BoardGameFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterTags: string[];
  onTagDelete: (tag: string) => void;
  onClearTags: () => void;
}

export const BoardGameFilter = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterTags,
  onTagDelete,
  onClearTags
}: BoardGameFilterProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="検索"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="並び替え"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="name">名前順</MenuItem>
          <MenuItem value="time">時間順</MenuItem>
          <MenuItem value="evaluation">評価順</MenuItem>
        </TextField>
      </Box>

      {filterTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}>
            選択中のタグ:
          </Typography>
          {filterTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => onTagDelete(tag)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          <Button size="small" onClick={onClearTags} sx={{ ml: 'auto' }}>
            すべてクリア
          </Button>
        </Box>
      )}
    </Box>
  );
};
