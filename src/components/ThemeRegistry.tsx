// ThemeRegistry pre Material-UI

'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/theme/theme';
import { ThemeProvider as ThemeModeProvider, useThemeMode } from '@/context/ThemeContext';
import { useMemo } from 'react';

function ThemeContent({ children }: { children: React.ReactNode }) {
  const { darkMode } = useThemeMode();

  const theme = useMemo(() => {
    return createAppTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <ThemeContent>{children}</ThemeContent>
    </ThemeModeProvider>
  );
}
