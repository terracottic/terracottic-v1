import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { ParallaxProvider } from 'react-scroll-parallax';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const MainLayout = () => {
  return (
    <ParallaxProvider>
      <Box 
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          overflowX: 'hidden',
          margin: 0,
          padding: 0,
          backgroundColor: '#fff',
        }}
      >
        <CssBaseline />
        <Navbar />
        <Box 
          component="main"
          sx={{
            flex: '1 0 auto',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              margin: 0,
              padding: 0,
              '& > *': {
                width: '100%',
                maxWidth: '100%',
              },
            }}
          >
            <Outlet />
          </Box>
        </Box>
        <Footer />
      </Box>
    </ParallaxProvider>
  );
};

export default MainLayout;
