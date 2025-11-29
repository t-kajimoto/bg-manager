import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Rating,
  Chip
} from '@mui/material';
import { IBoardGame } from '@/types/boardgame';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CasinoIcon from '@mui/icons-material/Casino';

interface GachaResultDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null;
}

export const GachaResultDialog = ({ open, onClose, game }: GachaResultDialogProps) => {
  if (!game) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          textAlign: 'center',
          p: 2,
          backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f0f4f8)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <CasinoIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          これに決まり！
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
            {game.name}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography>{game.min}～{game.max}人</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Typography>{game.time}分</Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="caption">平均評価</Typography>
            <Rating value={game.averageEvaluation} precision={0.1} readOnly size="large" />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {game.tags?.map((tag) => (
              <Chip key={tag} label={tag} color="primary" variant="outlined" />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{ minWidth: 150 }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
