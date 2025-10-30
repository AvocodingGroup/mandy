// MUI téma pre aplikáciu

'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#3B82F6', // moderná modrá
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B', // moderná oranžová
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // moderná zelená
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444', // moderná červená
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#3B82F6',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#F9FAFB' : '#111827',
      secondary: mode === 'dark' ? '#D1D5DB' : '#6B7280',
    },
    background: {
      default: mode === 'dark' ? '#111827' : '#F9FAFB',
      paper: mode === 'dark' ? '#1F2937' : '#FFFFFF',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '1.875rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.8125rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '6px 16px',
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '10px 22px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          '&:last-child': {
            paddingBottom: '12px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: '24px',
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        sizeSmall: {
          height: '20px',
          fontSize: '0.6875rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 10,
        },
      },
    },
  },
});

// Exportuj funkciu na vytvorenie témy
export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));

// Default light theme
export const theme = createAppTheme('light');
