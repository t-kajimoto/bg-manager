'use client';

import { Box, Container, Typography, Button, Snackbar, IconButton } from "@mui/material";
import Header from "./_components/Header";
import { useAuth } from "@/contexts/AuthContext";
import AddIcon from '@mui/icons-material/Add';
import CasinoIcon from '@mui/icons-material/Casino';
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
              onClick={() => dialogState.setOpenGachaDialog(true)}
            >
              ガチャ
            </Button>
            {customUser?.isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => dialogState.setOpenAddDialog(true)}
              >
                追加
              </Button>
            )}
          </Box>
        </Box>

        <BoardGameFilter
          searchQuery={filterState.searchQuery}
          onSearchChange={filterState.setSearchQuery}
          sortBy={filterState.sortBy}
          onSortChange={filterState.setSortBy}
          filterTags={filterState.filterTags}
          onTagDelete={handlers.handleTagDelete}
          onClearTags={() => filterState.setFilterTags([])}
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

      </Container>

      <AddBoardgameDialog
        open={dialogState.openAddDialog}
        onClose={() => dialogState.setOpenAddDialog(false)}
      />
      <EditBoardgameDialog
        open={dialogState.openEditDialog}
        onClose={() => dialogState.setOpenEditDialog(false)}
        game={selectionState.selectedGame}
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
