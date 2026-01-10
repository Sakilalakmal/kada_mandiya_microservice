import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  colors: {
    light: {
      background: '#FFFFFF',
      foreground: '#0A0A0A',
      muted: '#F3F4F6',
      border: '#E5E7EB',
      primary: '#2563EB',
      primaryForeground: '#FFFFFF',
      danger: '#DC2626',
      placeholder: '#6B7280',
    },
    dark: {
      background: '#0B0B0F',
      foreground: '#FFFFFF',
      muted: '#12121A',
      border: '#1F2937',
      primary: '#2563EB',
      primaryForeground: '#FFFFFF',
      danger: '#F87171',
      placeholder: '#9CA3AF',
    },
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  typography: {
    title: 24,
    subtitle: 15,
    body: 15,
    small: 13,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 3 },
    default: { elevation: 3 },
  }),
} as const;

export type AppTheme = {
  scheme: ColorScheme;
  colors: (typeof themeTokens.colors)[ColorScheme];
  spacing: typeof themeTokens.spacing;
  radius: typeof themeTokens.radius;
  typography: typeof themeTokens.typography;
  shadow: typeof themeTokens.shadow;
};

export function getTheme(scheme: ColorScheme): AppTheme {
  return {
    scheme,
    colors: themeTokens.colors[scheme],
    spacing: themeTokens.spacing,
    radius: themeTokens.radius,
    typography: themeTokens.typography,
    shadow: themeTokens.shadow,
  };
}

