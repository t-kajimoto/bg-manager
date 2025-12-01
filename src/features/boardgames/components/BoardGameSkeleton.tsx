import { Box, Card, CardContent, Skeleton } from '@mui/material';

export const BoardGameSkeleton = () => {
  return (
    <Box
      data-testid="board-game-skeleton"
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {[...Array(6)].map((_, index) => (
        <Card key={index} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', mb: 1 }}>
               <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
               <Skeleton variant="text" width={60} />
               <Skeleton variant="circular" width={24} height={24} sx={{ mx: 1 }} />
               <Skeleton variant="text" width={40} />
            </Box>
            <Skeleton variant="rectangular" height={40} sx={{ mt: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={20} width="60%" />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
