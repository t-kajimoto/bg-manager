import { useState } from 'react';
import { IBoardGame } from '../types';
import { useBoardgames } from './useBoardgames';
import { useBoardgameManager } from './useBoardgameManager';
import { GachaCondition } from '@/features/gacha/components/BodogeGachaDialog';

export const useBoardGamePage = () => {
  const { boardGames, loading, error } = useBoardgames();
  const { deleteBoardgame, loading: isDeleting } = useBoardgameManager();

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

  return {
    boardGames,
    loading,
    error,
    isDeleting,
    filteredBoardGames,
    allTags,
    dialogState: {
      openAddDialog, setOpenAddDialog,
      openEditDialog, setOpenEditDialog,
      openDeleteConfirm, setOpenDeleteConfirm,
      openEvaluationDialog, setOpenEvaluationDialog,
      openGachaDialog, setOpenGachaDialog,
      openGachaResult, setOpenGachaResult,
    },
    selectionState: {
      selectedGame, setSelectedGame,
      gachaResultGame, setGachaResultGame,
    },
    filterState: {
      searchQuery, setSearchQuery,
      filterTags, setFilterTags,
      sortBy, setSortBy,
    },
    snackbarState: {
      openSnackbar, setOpenSnackbar,
      snackbarMessage, setSnackbarMessage,
    },
    handlers: {
      handleEditClick,
      handleDeleteClick,
      handleDeleteConfirm,
      handleEvaluationClick,
      handleTagClick,
      handleTagDelete,
      handleGacha,
    }
  };
};
