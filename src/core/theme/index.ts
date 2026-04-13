/**
 * Global theme – single entry for the app.
 * Import { useTheme, theme, ThemeProvider } from '@/core/theme'
 * Use useTheme() in components for reactive light/dark; use theme for static defaults.
 */

export {
  colorsLight,
  colorsDark,
  defaultColors,
  spacing,
  borderRadius,
  typography,
  theme,
  type ColorPalette,
  type Theme,
} from './tokens';

export { ThemeProvider, useTheme } from './ThemeContext';
