'use client';

import { useState } from 'react';
import { Box, Container, Typography, Button, Snackbar, IconButton, Tabs, Tab } from "@mui/material";
import Header from "./_components/Header";
import { useAuth } from "@/contexts/AuthContext";
import AddIcon from '@mui/icons-material/Add';
import CasinoIcon from '@mui/icons-material/Casino';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { AddBoardgameDialog } from "@/features/boardgames/components/AddBoardgameDialog";
import { EditBoardgameDialog } from "@/features/boardgames/components/EditBoardgameDialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EditUserEvaluationDialog } from "@/features/boardgames/components/EditUserEvaluationDialog";
import { BodogeGachaDialog } from "@/features/gacha/components/BodogeGachaDialog";
import { GachaResultDialog } from "@/features/gacha/components/GachaResultDialog";
import { BoardGameList } from "@/features/boardgames/components/BoardGameList";
import { BoardGameFilter } from "@/features/boardgames/components/BoardGameFilter";
import { useBoardGamePage } from "@/features/boardgames/hooks/useBoardGamePage";
import { MatchList } from "@/features/matches/components/MatchList";
import { MatchDialog } from "@/features/matches/components/MatchDialog";
import { IMatch } from "@/features/matches/types";
import { UserListTab } from "@/features/auth/components/UserListTab";

export default function Home() {
  const { customUser } = useAuth();
  const {
    boardGames,
    loading,
    error,
    isDeleting,
    filteredBoardGames,
    allTags,
    dialogState,
    selectionState,
    filterState,
    snackbarState,
    handlers
  } = useBoardGamePage();

  const [tabIndex, setTabIndex] = useState(0);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [matchDialogMode, setMatchDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedMatch, setSelectedMatch] = useState<IMatch | undefined>(undefined);
  const [matchListKey, setMatchListKey] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleMatchSuccess = () => {
      setMatchListKey(prev => prev + 1);
      handlers.refreshData(); // Also refresh board games generally
  };

  const handleAddMatch = () => {
    setMatchDialogMode('add');
    setSelectedMatch(undefined);
    setOpenMatchDialog(true);
  };

  const handleEditMatch = (match: IMatch) => {
    setMatchDialogMode('edit');
    setSelectedMatch(match);
    setOpenMatchDialog(true);
  };

  return (
    <Box>
      <Header />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
          gap: 2
        }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
            マイ・ボードゲーム
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
             <Button
              variant="outlined"
              startIcon={<CasinoIcon />}
              onClick={() => dialogState.setOpenGachaDialog(true)}
              fullWidth={true}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              ガチャ
            </Button>
            {customUser && (
              <>
                <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleAddMatch}
                    fullWidth={true}
                    sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                    戦績記録
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => dialogState.setOpenAddDialog(true)}
                    fullWidth={true}
                    sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                    追加
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="basic tabs example">
                <Tab label="ボードゲーム一覧" />
                <Tab label="戦績履歴" />
                <Tab label="ユーザー一覧" />
            </Tabs>
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 0} sx={{ display: tabIndex === 0 ? 'block' : 'none' }}>
            <BoardGameFilter
            searchQuery={filterState.searchQuery}
            onSearchChange={filterState.setSearchQuery}
            sortBy={filterState.sortBy}
            onSortChange={filterState.setSortBy}
            filterTags={filterState.filterTags}
            onTagDelete={handlers.handleTagDelete}
            onClearTags={() => filterState.setFilterTags([])}
            onlyOwned={filterState.onlyOwned}
            onOnlyOwnedChange={filterState.setOnlyOwned}
            />

            <BoardGameList
            games={filteredBoardGames}
            loading={loading}
            error={error}
            onEdit={handlers.handleEditClick}
            onDelete={handlers.handleDeleteClick}
            onEvaluation={handlers.handleEvaluationClick}
            onTagClick={handlers.handleTagClick}
            onAdd={() => dialogState.setOpenAddDialog(true)}
            onClearFilter={() => { filterState.setSearchQuery(''); filterState.setFilterTags([]); }}
            isEmptyResult={filteredBoardGames.length === 0 && boardGames.length > 0}
            />
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 1} sx={{ display: tabIndex === 1 ? 'block' : 'none' }}>
            <MatchList key={matchListKey} onEdit={handleEditMatch} />
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 2} sx={{ display: tabIndex === 2 ? 'block' : 'none' }}>
            <UserListTab />
        </Box>

      </Container>

      <AddBoardgameDialog
        open={dialogState.openAddDialog}
        onClose={() => dialogState.setOpenAddDialog(false)}
        onSuccess={handlers.refreshData}
      />
      <MatchDialog
        open={openMatchDialog}
        onClose={() => setOpenMatchDialog(false)}
        boardGames={boardGames}
        onSuccess={handleMatchSuccess}
        mode={matchDialogMode}
        initialData={selectedMatch}
      />
      <EditBoardgameDialog
        open={dialogState.openEditDialog}
        onClose={() => dialogState.setOpenEditDialog(false)}
        game={selectionState.selectedGame}
        onSuccess={handlers.refreshData}
      />
      <ConfirmationDialog
        open={dialogState.openDeleteConfirm}
        onClose={() => dialogState.setOpenDeleteConfirm(false)}
        onConfirm={handlers.handleDeleteConfirm}
        title="ボードゲームの削除"
        message={`本当に「${selectionState.selectedGame?.name}」を削除しますか？この操作は元に戻せません。`}
        confirmText="削除"
        loading={isDeleting}
      />
      <EditUserEvaluationDialog
        open={dialogState.openEvaluationDialog}
        onClose={() => dialogState.setOpenEvaluationDialog(false)}
        game={selectionState.selectedGame}
        onSuccess={handlers.refreshData}
      />
      <BodogeGachaDialog
        open={dialogState.openGachaDialog}
        onClose={handlers.handleGacha}
        allTags={allTags}
      />
      <GachaResultDialog
        open={dialogState.openGachaResult}
        onClose={() => dialogState.setOpenGachaResult(false)}
        game={selectionState.gachaResultGame}
      />

      <Snackbar
        open={snackbarState.openSnackbar}
        autoHideDuration={6000}
        onClose={() => snackbarState.setOpenSnackbar(false)}
        message={snackbarState.snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => snackbarState.setOpenSnackbar(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
