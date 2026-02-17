'use client';

import {
  Box, Typography, Card, CardActions, CardContent, CardMedia,
  Chip, Rating, Button, Stack
} from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IBoardGame } from "../types";
import { useAuth } from "@/contexts/AuthContext";

interface BoardGameCardProps {
  game: IBoardGame;
  onEdit?: (game: IBoardGame) => void;
  onDelete?: (game: IBoardGame) => void;
  onEvaluation?: (game: IBoardGame) => void;
  onTagClick: (tag: string) => void;
  readOnly?: boolean;
}

export const BoardGameCard = ({ game, onEdit, onDelete, onEvaluation, onTagClick, readOnly }: BoardGameCardProps) => {
  const { customUser } = useAuth();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {game.thumbnailUrl && (
        <CardMedia
          component="img"
          height="140"
          image={game.thumbnailUrl}
          alt={game.name}
          sx={{ objectFit: 'contain', backgroundColor: '#f0f0f0', p: 1 }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ flexGrow: 1 }}>
                {game.name}
            </Typography>
            {game.isOwned && (
                <Chip
                    icon={<CheckCircleIcon />}
                    label="所持"
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, mt: 0.5 }}
                />
            )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
          <PeopleIcon sx={{ mr: 1, fontSize: 'small' }} />
          <Typography variant="body2" sx={{ mr: 2 }}>{game.min}～{game.max}人</Typography>
          <AccessTimeIcon sx={{ mr: 1, fontSize: 'small' }} />
          <Typography variant="body2">{game.time}分</Typography>
        </Box>
        
        {game.yearPublished && (
             <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {game.yearPublished}年
             </Typography>
        )}

        <Box sx={{ mt: 1 }}>
            {game.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} onClick={() => onTagClick(tag)}/>
            ))}
        </Box>

        <Box
          sx={{ mt: 2, cursor: !readOnly && customUser ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 1 }}
          onClick={() => !readOnly && onEvaluation && onEvaluation(game)}
        >
          <Rating value={readOnly ? game.averageEvaluation : game.evaluation} readOnly size="small" />
          <Typography variant="caption">{readOnly ? '平均評価' : 'あなたの評価'}</Typography>
        </Box>
      </CardContent>
      {!readOnly && customUser && (
        <CardActions>
          <Button size="small" onClick={() => onEdit && onEdit(game)}>編集</Button>
          <Button size="small" color="error" onClick={() => onDelete && onDelete(game)}>削除</Button>
        </CardActions>
      )}
    </Card>
  );
};
