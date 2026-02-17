'use client';

import { Box, Typography, Button, Alert } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { IBoardGame } from "../types";
import { BoardGameCard } from "./BoardGameCard";
import { BoardGameSkeleton } from "./BoardGameSkeleton";
import { useAuth } from "@/contexts/AuthContext";

interface BoardGameListProps {
  games: IBoardGame[];
  loading: boolean;
  error: Error | null;
  onEdit: (game: IBoardGame) => void;
  onDelete: (game: IBoardGame) => void;
  onEvaluation: (game: IBoardGame) => void;
  onTagClick: (tag: string) => void;
  onAdd: () => void;
  onClearFilter: () => void;
  isEmptyResult: boolean;
}

export const BoardGameList = ({
  games,
  loading,
  error,
  onEdit,
  onDelete,
  onEvaluation,
  onTagClick,
  onAdd,
  onClearFilter,
  isEmptyResult
}: BoardGameListProps) => {
  const { customUser } = useAuth();

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

  if (isEmptyResult) {
     return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          条件に一致するゲームが見つかりませんでした。
        </Typography>
        <Button onClick={onClearFilter} sx={{ mt: 2 }}>
           条件をクリア
        </Button>
      </Box>
    );
  }

  if (games.length === 0) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
         <Typography variant="h6" color="text.secondary">
          登録されているボードゲームはありません。
        </Typography>
        {customUser?.isAdmin && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd} sx={{ mt: 2 }}>
            最初のゲームを追加
          </Button>
        )}
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
      {games.map((game) => (
        <Box key={game.id}>
          <BoardGameCard
            game={game}
            onEdit={onEdit}
            onDelete={onDelete}
            onEvaluation={onEvaluation}
            onTagClick={onTagClick}
          />
        </Box>
      ))}
    </Box>
  );
};
