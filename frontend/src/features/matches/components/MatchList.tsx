'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Box, Chip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getMatches } from '@/app/actions/boardgames';
import { IMatch } from '@/features/matches/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MatchListProps {
  onEdit?: (match: IMatch) => void;
  userId?: string;
}

export const MatchList = ({ onEdit, userId }: MatchListProps) => {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const { data } = await getMatches(undefined, userId);
    if (data) {
      setMatches(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return <Typography>Loading matches...</Typography>;
  }

  if (matches.length === 0) {
    return <Typography>戦績はまだありません。</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {matches.map((match) => (
        <Card key={match.id} variant="outlined" sx={{ position: 'relative' }}>
          {onEdit && (
            <IconButton 
              size="small" 
              sx={{ position: 'absolute', top: 8, right: 8 }} 
              onClick={() => onEdit(match)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <CardContent sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {match.imageUrl && (
                <Box
                    component="img"
                    src={match.imageUrl}
                    sx={{ width: { xs: '100%', sm: 120 }, height: 120, objectFit: 'cover', borderRadius: 1 }}
                />
            )}
            <Box sx={{ flexGrow: 1, pr: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {match.boardGameName || 'Unknown Game'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(match.date), 'yyyy年MM月dd日', { locale: ja })}
                   {match.location && ` @ ${match.location}`}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <List dense>
                  {match.players?.sort((a, b) => (a.rank || 0) - (b.rank || 0)).map((player) => (
                    <ListItem key={player.id} disablePadding>
                      <ListItemText 
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24 }}>{player.rank}位</Typography>
                                {player.player_name}
                                {player.rank === 1 && <Chip label="Winner" color="warning" size="small" />}
                            </Box>
                        }
                        secondary={`Score: ${player.score || '-'}${player.role ? ` (${player.role})` : ''}`} 
                      />
                    </ListItem>
                  ))}
                </List>
                
                {match.note && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                        Memo: {match.note}
                    </Typography>
                )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
