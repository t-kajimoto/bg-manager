'use client';

import {
  Box, Typography, Card, CardActions, CardContent,
  Chip, Rating, Button
} from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { IBoardGame } from "../types";
import { useAuth } from "@/contexts/AuthContext";

interface BoardGameCardProps {
  game: IBoardGame;
  onEdit: (game: IBoardGame) => void;
  onDelete: (game: IBoardGame) => void;
  onEvaluation: (game: IBoardGame) => void;
  onTagClick: (tag: string) => void;
}

export const BoardGameCard = ({ game, onEdit, onDelete, onEvaluation, onTagClick }: BoardGameCardProps) => {
  const { customUser } = useAuth();

  return (
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
          onClick={() => customUser && onEvaluation(game)}
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
            <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} onClick={() => onTagClick(tag)}/>
          ))}
        </Box>
      </CardContent>
      {customUser?.isAdmin && (
        <CardActions>
          <Button size="small" onClick={() => onEdit(game)}>編集</Button>
          <Button size="small" color="error" onClick={() => onDelete(game)}>削除</Button>
        </CardActions>
      )}
    </Card>
  );
};
