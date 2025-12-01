'use client';

import {
  Box, Container, Typography, Card, CardActions, CardContent,
  Chip, Rating, Alert, Button, TextField, InputAdornment, MenuItem, Snackbar, IconButton
} from "@mui/material";
import Header from "./_components/Header";
import { useBoardgames } from "@/hooks/useBoardgames";
import { useAuth } from "@/contexts/AuthContext";
import { IBoardGame } from "@/types/boardgame";
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import { AddBoardgameDialog } from "@/components/AddBoardgameDialog";
import { EditBoardgameDialog } from "@/components/EditBoardgameDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EditUserEvaluationDialog } from "@/components/EditUserEvaluationDialog";
import { BodogeGachaDialog, GachaCondition } from "@/components/BodogeGachaDialog";
import { GachaResultDialog } from "@/components/GachaResultDialog";
import { BoardGameSkeleton } from "@/components/BoardGameSkeleton";
import { useBoardgameManager } from '@/hooks/useBoardgameManager';
import { useState } from "react";

export default function Home() {
  const { boardGames, loading, error } = useBoardgames();
  const { customUser } = useAuth();

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openEvaluationDialog, setOpenEvaluationDialog] = useState(false);
  const [openGachaDialog, setOpenGachaDialog] = useState(false);
  const [openGachaResult, setOpenGachaResult] = useState(false);

  // Selection states
  const [selectedGame, setSelectedGame] = useState<IBoardGame | null>(null);
  const [gachaResultGame, setGachaResultGame] = useState<IBoardGame | null>(null);

  // Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');

  // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const { deleteBoardgame, loading: isDeleting } = useBoardgameManager();

  const handleEditClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedGame) {
      await deleteBoardgame(selectedGame.id);
      setOpenDeleteConfirm(false);
      setSelectedGame(null);
    }
  };

  const handleEvaluationClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenEvaluationDialog(true);
  };

  const allTags = Array.from(new Set(boardGames.flatMap(g => g.tags || []))).sort();

  const handleTagClick = (tag: string) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setFilterTags(filterTags.filter((tag) => tag !== tagToDelete));
  };

  const filteredBoardGames = boardGames.filter(game => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = game.name.toLowerCase().includes(query) || game.tags?.some(t => t.toLowerCase().includes(query));
    const matchesTags = filterTags.length === 0 || filterTags.every(t => game.tags?.includes(t));
    return matchesSearch && matchesTags;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'time') return a.time - b.time;
    if (sortBy === 'evaluation') return (b.averageEvaluation || 0) - (a.averageEvaluation || 0);
    return 0;
  });

  const handleGacha = (condition?: GachaCondition) => {
    setOpenGachaDialog(false);
    if (!condition) return;

    const candidates = boardGames.filter(game => {
      if (condition.players !== null && (game.min > condition.players || game.max < condition.players)) return false;
      if (condition.playStatus === 'played' && !game.played) return false;
      if (condition.playStatus === 'unplayed' && game.played) return false;
      if (condition.tags.length > 0 && !condition.tags.every(t => game.tags?.includes(t))) return false;
      if (game.time < condition.timeRange[0] || game.time > condition.timeRange[1]) return false;
      if ((game.averageEvaluation || 0) < condition.ratingRange[0] || (game.averageEvaluation || 0) > condition.ratingRange[1]) return false;
      return true;
    });

    if (candidates.length > 0) {
      const winner = candidates[Math.floor(Math.random() * candidates.length)];
      setGachaResultGame(winner);
      setOpenGachaResult(true);
    } else {
      setSnackbarMessage("条件に合うゲームが見つかりませんでした。");
      setOpenSnackbar(true);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <BoardGameSkeleton />;
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          データの読み込み中にエラーが発生しました: {error.message}
        </Alert>
      );
    }

    if (boardGames.length === 0) {
      return (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
           <Typography variant="h6" color="text.secondary">
            登録されているボードゲームはありません。
          </Typography>
          {customUser?.isAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ mt: 2 }}>
              最初のゲームを追加
            </Button>
          )}
        </Box>
      );
    }

    if (filteredBoardGames.length === 0) {
       return (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            条件に一致するゲームが見つかりませんでした。
          </Typography>
          <Button onClick={() => { setSearchQuery(''); setFilterTags([]); }} sx={{ mt: 2 }}>
             条件をクリア
          </Button>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        {filteredBoardGames.map((game) => (
          <Box key={game.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {game.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">{game.min}～{game.max}人</Typography>
                  <AccessTimeIcon sx={{ mx: 1 }} />
                  <Typography variant="body2">{game.time}分</Typography>
                </Box>
                <Box
                  sx={{ mt: 1, cursor: customUser ? 'pointer' : 'default' }}
                  onClick={() => customUser && handleEvaluationClick(game)}
                >
                  <Typography component="legend" variant="caption">あなたの評価</Typography>
                  <Rating value={game.evaluation} readOnly />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography component="legend" variant="caption">平均評価</Typography>
                  <Rating value={game.averageEvaluation} precision={0.1} readOnly />
                </Box>
                <Box sx={{ mt: 2 }}>
                  {game.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} onClick={() => handleTagClick(tag)}/>
                  ))}
                </Box>
              </CardContent>
              {customUser?.isAdmin && (
                <CardActions>
                  <Button size="small" onClick={() => handleEditClick(game)}>編集</Button>
                  <Button size="small" color="error" onClick={() => handleDeleteClick(game)}>削除</Button>
                </CardActions>
              )}
            </Card>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Header />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            ボードゲーム一覧
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
             <Button
              variant="outlined"
              startIcon={<CasinoIcon />}
              onClick={() => setOpenGachaDialog(true)}
            >
              ガチャ
            </Button>
            {customUser?.isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
              >
                追加
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="検索"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
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
              onChange={(e) => setSortBy(e.target.value)}
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
                  onDelete={() => handleTagDelete(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
              <Button size="small" onClick={() => setFilterTags([])} sx={{ ml: 'auto' }}>
                すべてクリア
              </Button>
            </Box>
          )}
        </Box>

        {renderContent()}
      </Container>

      <AddBoardgameDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} />
      <EditBoardgameDialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} game={selectedGame} />
      <ConfirmationDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="ボードゲームの削除"
        message={`本当に「${selectedGame?.name}」を削除しますか？この操作は元に戻せません。`}
        confirmText="削除"
        loading={isDeleting}
      />
      <EditUserEvaluationDialog open={openEvaluationDialog} onClose={() => setOpenEvaluationDialog(false)} game={selectedGame} />
      <BodogeGachaDialog open={openGachaDialog} onClose={handleGacha} allTags={allTags} />
      <GachaResultDialog open={openGachaResult} onClose={() => setOpenGachaResult(false)} game={gachaResultGame} />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setOpenSnackbar(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
