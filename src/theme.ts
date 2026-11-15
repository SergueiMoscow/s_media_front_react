import { createTheme, type Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

export function getTheme(mode: ColorMode): Theme {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#5c6bc0',
      },
      secondary: {
        main: '#26a69a',
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    shape: {
      borderRadius: 10,
    },
  });
}
