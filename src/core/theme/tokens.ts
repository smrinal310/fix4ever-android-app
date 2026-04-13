/**
 * Theme tokens only (no context). Used by ThemeContext and re-exported from index.
 */

export const colorsLight = {
  background: '#FFFFFF',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  popover: '#FFFFFF',
  popoverForeground: '#0F172A',
  primary: '#7C3AED',
  primaryForeground: '#F5F3FF',
  secondary: '#F1F5F9',
  secondaryForeground: '#334155',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  accent: '#F1F5F9',
  accentForeground: '#334155',
  destructive: '#DC2626',
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#A78BFA',
  chart1: '#C4B5FD',
  chart2: '#A78BFA',
  chart3: '#7C3AED',
  chart4: '#6D28D9',
  chart5: '#5B21B6',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#0F172A',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
} as const;

export const colorsDark = {
  background: '#0F172A',
  foreground: '#F8FAFC',
  card: '#334155',
  cardForeground: '#F8FAFC',
  popover: '#334155',
  popoverForeground: '#F8FAFC',
  primary: '#A78BFA',
  primaryForeground: '#F5F3FF',
  secondary: '#334155',
  secondaryForeground: '#F8FAFC',
  muted: '#334155',
  mutedForeground: '#94A3B8',
  accent: '#334155',
  accentForeground: '#F8FAFC',
  destructive: '#EF4444',
  border: 'rgba(255,255,255,0.1)',
  input: 'rgba(255,255,255,0.15)',
  ring: '#7C3AED',
  chart1: '#C4B5FD',
  chart2: '#A78BFA',
  chart3: '#7C3AED',
  chart4: '#6D28D9',
  chart5: '#5B21B6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  surface: '#334155',
  white: '#FFFFFF',
  black: '#0F172A',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export type ColorPalette = typeof colorsLight | typeof colorsDark;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  radius: 10,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  titleSmall: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
} as const;

export const defaultColors = colorsLight;

export const theme = {
  colors: defaultColors,
  spacing,
  borderRadius,
  typography,
} as const;

export type Theme = {
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
};
