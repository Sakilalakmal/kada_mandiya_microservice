export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  typography: {
    title: 28,
    subtitle: 16,
    body: 16,
    caption: 13,
  },
  colors: {
    light: {
      background: '#FFFFFF',
      foreground: '#0B0B0B',
      muted: '#F3F4F6',
      border: '#E5E7EB',
      primary: '#2563EB',
      primaryForeground: '#FFFFFF',
      danger: '#DC2626',
      placeholder: '#6B7280',
    },
    dark: {
      background: '#000000',
      foreground: '#FFFFFF',
      muted: '#0B0B0B',
      border: '#1F2937',
      primary: '#2563EB',
      primaryForeground: '#FFFFFF',
      danger: '#F87171',
      placeholder: '#9CA3AF',
    },
  },
} as const;

export type AppTheme = {
  scheme: ColorScheme;
  colors: (typeof themeTokens.colors)[ColorScheme];
  spacing: typeof themeTokens.spacing;
  radius: typeof themeTokens.radius;
  typography: typeof themeTokens.typography;
};

export function getTheme(scheme: ColorScheme): AppTheme {
  return {
    scheme,
    colors: themeTokens.colors[scheme],
    spacing: themeTokens.spacing,
    radius: themeTokens.radius,
    typography: themeTokens.typography,
  };
}

