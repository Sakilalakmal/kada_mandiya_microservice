import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  colors: {
    light: {
      // Modern, airy backgrounds
      background: '#F6F7FB',
      backgroundSecondary: '#FFFFFF',
      backgroundTertiary: '#EEF1F7',
      
      // Clear text hierarchy
      foreground: '#0B1220',
      foregroundSecondary: '#3D4A66',
      
      // Minimal grays
      muted: '#EEF1F7',
      mutedForeground: '#6A7691',
      
      // Clean borders
      border: '#E1E6F0',
      borderSubtle: '#EDF1F7',
      
      // Primary brand - fresh green
      primary: '#2FB44A',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#DDF7E3',
      primaryDark: '#1F8A37',
      
      // Minimal accent
      accent: '#A3E635',
      accentForeground: '#0B1220',
      accentMuted: '#ECFCCB',
      
      // System colors - clean
      success: '#16A34A',
      successForeground: '#FFFFFF',
      successMuted: '#D1FAE5',
      
      warning: '#F59E0B',
      warningForeground: '#FFFFFF',
      warningMuted: '#FEF3C7',
      
      danger: '#EF4444',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#FEE2E2',
      
      // Utility
      placeholder: '#9AA6BF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      
      // Clean cards
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      cardTinted: '#F2FFF5',
      
      // Minimal variants
      lavender: '#A78BFA',
      lavenderMuted: '#EDE9FE',
      peach: '#FB923C',
      peachMuted: '#FED7AA',
      sage: '#34D399',
      sageMuted: '#D1FAE5',
    },
    dark: {
      background: '#070A10',
      backgroundSecondary: '#0B1020',
      backgroundTertiary: '#0F1730',
      
      foreground: '#FFFFFF',
      foregroundSecondary: '#A1A1AA',
      
      muted: '#121A33',
      mutedForeground: '#8A96B5',
      
      border: '#1C2547',
      borderSubtle: '#121A33',
      
      primary: '#3BD66A',
      primaryForeground: '#05110A',
      primaryMuted: '#0F2A18',
      primaryDark: '#2FB44A',
      
      accent: '#A3E635',
      accentForeground: '#05110A',
      accentMuted: '#1E2A10',
      
      success: '#22C55E',
      successForeground: '#05110A',
      successMuted: '#064E3B',
      
      warning: '#FBBF24',
      warningForeground: '#0B1220',
      warningMuted: '#78350F',
      
      danger: '#F87171',
      dangerForeground: '#0B1220',
      dangerMuted: '#7F1D1D',
      
      placeholder: '#657196',
      overlay: 'rgba(0, 0, 0, 0.8)',
      
      card: '#0B1020',
      cardElevated: '#0F1730',
      cardTinted: '#0F2A18',
      
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
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 28,
    full: 9999,
  },
  typography: {
    // Clean, readable sizes
    display: 32,
    displayLarge: 36,
    h1: 28,
    h2: 26,
    h3: 20,
    h4: 18,
    // Back-compat aliases (used across screens/components)
    title: 18,
    subtitle: 16,
    // Body text
    body: 15,
    bodyLarge: 16,
    bodySmall: 14,
    caption: 12,
    small: 12,
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
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
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
