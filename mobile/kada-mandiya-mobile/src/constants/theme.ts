import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  colors: {
    light: {
      // Clean, minimal backgrounds
      background: '#FFFFFF',
      backgroundSecondary: '#F8F9FA',
      backgroundTertiary: '#F1F3F5',
      
      // Clear text hierarchy
      foreground: '#000000',
      foregroundSecondary: '#495057',
      
      // Minimal grays
      muted: '#F1F3F5',
      mutedForeground: '#6C757D',
      
      // Clean borders
      border: '#DEE2E6',
      borderSubtle: '#E9ECEF',
      
      // Simple accent - professional teal
      primary: '#0EA5E9',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#E0F2FE',
      primaryDark: '#0284C7',
      
      // Minimal accent
      accent: '#3B82F6',
      accentForeground: '#FFFFFF',
      accentMuted: '#DBEAFE',
      
      // System colors - clean
      success: '#10B981',
      successForeground: '#FFFFFF',
      successMuted: '#D1FAE5',
      
      warning: '#F59E0B',
      warningForeground: '#FFFFFF',
      warningMuted: '#FEF3C7',
      
      danger: '#EF4444',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#FEE2E2',
      
      // Utility
      placeholder: '#9CA3AF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      
      // Clean cards
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      cardTinted: '#F8F9FA',
      
      // Minimal variants
      lavender: '#A78BFA',
      lavenderMuted: '#EDE9FE',
      peach: '#FB923C',
      peachMuted: '#FED7AA',
      sage: '#34D399',
      sageMuted: '#D1FAE5',
    },
    dark: {
      background: '#000000',
      backgroundSecondary: '#0A0A0A',
      backgroundTertiary: '#141414',
      
      foreground: '#FFFFFF',
      foregroundSecondary: '#A1A1AA',
      
      muted: '#18181B',
      mutedForeground: '#71717A',
      
      border: '#27272A',
      borderSubtle: '#18181B',
      
      primary: '#38BDF8',
      primaryForeground: '#000000',
      primaryMuted: '#082F49',
      primaryDark: '#0EA5E9',
      
      accent: '#60A5FA',
      accentForeground: '#000000',
      accentMuted: '#1E3A8A',
      
      success: '#34D399',
      successForeground: '#000000',
      successMuted: '#064E3B',
      
      warning: '#FBBF24',
      warningForeground: '#000000',
      warningMuted: '#78350F',
      
      danger: '#F87171',
      dangerForeground: '#000000',
      dangerMuted: '#7F1D1D',
      
      placeholder: '#52525B',
      overlay: 'rgba(0, 0, 0, 0.8)',
      
      card: '#0A0A0A',
      cardElevated: '#141414',
      cardTinted: '#18181B',
      
      lavender: '#A78BFA',
      lavenderMuted: '#2E1065',
      peach: '#FB923C',
      peachMuted: '#431407',
      sage: '#34D399',
      sageMuted: '#064E3B',
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
    xxxxl: 48,
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  typography: {
    // Clean, readable sizes
    display: 32,
    displayLarge: 36,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    subtitle: 16,
    // Body text
    body: 15,
    bodyLarge: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 11,
    // Price
    priceDisplay: 24,
    priceLarge: 20,
    // Line heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
    // Font weights
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
      black: '900' as const,
    },
  },
  shadow: {
    none: {},
    // Minimal shadows
    sm: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
    // For floating elements
    float: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
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
