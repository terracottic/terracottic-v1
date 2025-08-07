import { createTheme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';

// Create a theme instance with proper initialization
const createAppTheme = (mode = 'light') => {
  return createTheme(
    {
      palette: {
        mode,
        primary: {
          main: '#8B4513', // saddle brown
          light: '#a5672d',
          dark: '#5D2906',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#9c27b0',
          light: '#ba68c8',
          dark: '#7b1fa2',
          contrastText: '#fff',
        },
        error: {
          main: '#d32f2f',
        },
        warning: {
          main: '#ed6c02',
        },
        info: {
          main: '#0288d1',
        },
        success: {
          main: '#2e7d32',
        },
        background: {
          default: mode === 'light' ? '#f5f5f5' : '#121212',
          paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ].join(','),
        h1: {
          fontSize: '2.5rem',
          fontWeight: 500,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 500,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 500,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 500,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 500,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              background: 'linear-gradient(135deg, #8B4513 0%, #5D2906 100%)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              fontWeight: 500,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
            },
          },
        },
      },
    },
    esES // Spanish locale
  );
};

// Create light theme by default
const theme = createAppTheme('light');

export default theme;
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

export default theme;
