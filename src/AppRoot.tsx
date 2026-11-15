import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { getTheme } from './theme';
import { useColorMode } from './ColorModeContext';
import { ToastProvider } from './components/ToastContext';

/** Применяет динамическую тему (светлую/тёмную) и общие провайдеры. */
export default function AppRoot() {
  const { mode } = useColorMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  );
}
