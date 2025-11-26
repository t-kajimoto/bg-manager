import { Box, Container, Typography } from "@mui/material";
import Header from "./_components/Header";

export default function Home() {
  return (
    <Box>
      <Header />
      <Container component="main" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Board Game List
        </Typography>
        <Typography>
          (Board game list will be displayed here)
        </Typography>
      </Container>
    </Box>
  );
}
