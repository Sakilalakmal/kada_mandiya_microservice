import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  colors: {
    light: {
      background: '#FFFFFF',
      backgroundSecondary: '#FAFBFC',
      foreground: '#09090B',
      foregroundSecondary: '#3F3F46',
      muted: '#F4F4F5',
      mutedForeground: '#71717A',
      border: '#E4E4E7',
      borderSubtle: '#F4F4F5',
      primary: '#2563EB',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#EFF6FF',
      success: '#10B981',
      successForeground: '#FFFFFF',
      successMuted: '#D1FAE5',
      warning: '#F59E0B',
      warningForeground: '#FFFFFF',
      warningMuted: '#FEF3C7',
      danger: '#EF4444',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#FEE2E2',
      placeholder: '#A1A1AA',
      overlay: 'rgba(0, 0, 0, 0.5)',
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
    },
    dark: {
      background: '#09090B',
      backgroundSecondary: '#18181B',
      foreground: '#FAFAFA',
      foregroundSecondary: '#A1A1AA',
      muted: '#18181B',
      mutedForeground: '#71717A',
      border: '#27272A',
      borderSubtle: '#18181B',
      primary: '#3B82F6',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#1E3A8A',
      success: '#10B981',
      successForeground: '#FFFFFF',
      successMuted: '#064E3B',
      warning: '#F59E0B',
      warningForeground: '#FFFFFF',
      warningMuted: '#78350F',
      danger: '#EF4444',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#7F1D1D',
      placeholder: '#52525B',
      overlay: 'rgba(0, 0, 0, 0.7)',
      card: '#18181B',
      cardElevated: '#27272A',
    },
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  typography: {
    // Display & Headings
    display: 32,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    // Body & UI
    body: 15,
    bodyLarge: 16,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
  },
  shadow: {
    none: {},
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
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
