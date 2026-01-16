import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const themeTokens = {
  colors: {
    light: {
      // Soft, warm backgrounds (cream/beige tones)
      background: '#FAF9F7',
      backgroundSecondary: '#F5F3F0',
      backgroundTertiary: '#FFF8F0',
      
      // Text colors - softer blacks
      foreground: '#1F1F1F',
      foregroundSecondary: '#525252',
      
      // Muted tones
      muted: '#F0EDE8',
      mutedForeground: '#737373',
      
      // Borders - very subtle
      border: '#E8E5E0',
      borderSubtle: '#F0EDE8',
      
      // Primary - soft green/teal (nature inspired)
      primary: '#4B9B8C',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#E6F4F1',
      primaryDark: '#3A7A6F',
      
      // Accent - warm terracotta/coral
      accent: '#E87461',
      accentForeground: '#FFFFFF',
      accentMuted: '#FFF0ED',
      
      // Success - soft mint green
      success: '#52B788',
      successForeground: '#FFFFFF',
      successMuted: '#E8F5E9',
      
      // Warning - soft amber
      warning: '#F4A261',
      warningForeground: '#FFFFFF',
      warningMuted: '#FFF4E6',
      
      // Danger - soft coral red
      danger: '#E76F51',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#FFE8E3',
      
      // Utility colors
      placeholder: '#A3A3A3',
      overlay: 'rgba(31, 31, 31, 0.5)',
      
      // Cards - soft whites with warmth
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      cardTinted: '#FFF8F0',
      
      // Feature colors for variety
      lavender: '#B4A7D6',
      lavenderMuted: '#F3F0FA',
      peach: '#FFB5A7',
      peachMuted: '#FFF5F3',
      sage: '#A8DADC',
      sageMuted: '#F0F8F8',
    },
    dark: {
      // Dark mode - softer, warmer darks
      background: '#1A1816',
      backgroundSecondary: '#252320',
      backgroundTertiary: '#2D2A27',
      
      foreground: '#F5F5F5',
      foregroundSecondary: '#C7C7C7',
      
      muted: '#2D2A27',
      mutedForeground: '#8A8A8A',
      
      border: '#3A3633',
      borderSubtle: '#2D2A27',
      
      // Primary - slightly brighter for dark mode
      primary: '#5FB3A3',
      primaryForeground: '#FFFFFF',
      primaryMuted: '#2A4541',
      primaryDark: '#4B9B8C',
      
      // Accent
      accent: '#F08A76',
      accentForeground: '#FFFFFF',
      accentMuted: '#3D2B28',
      
      success: '#66C29A',
      successForeground: '#FFFFFF',
      successMuted: '#2A3F35',
      
      warning: '#F4A261',
      warningForeground: '#FFFFFF',
      warningMuted: '#3D342B',
      
      danger: '#EC8A7A',
      dangerForeground: '#FFFFFF',
      dangerMuted: '#3D2F2B',
      
      placeholder: '#6B6B6B',
      overlay: 'rgba(0, 0, 0, 0.75)',
      
      card: '#252320',
      cardElevated: '#2D2A27',
      cardTinted: '#2D2723',
      
      lavender: '#9B8FC4',
      lavenderMuted: '#2D2A33',
      peach: '#E09C8E',
      peachMuted: '#342E2C',
      sage: '#8EC5C7',
      sageMuted: '#2A3535',
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
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    full: 9999,
  },
  typography: {
    // Display & Headings - increased sizes for impact
    display: 36,
    displayLarge: 42,
    h1: 30,
    h2: 26,
    h3: 22,
    h4: 18,
    subtitle: 16,
    // Body & UI
    body: 15,
    bodyLarge: 17,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
    // Price display - special formatting
    priceDisplay: 28,
    priceLarge: 24,
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    // Font weights (for easy reference)
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
    // Soft, subtle shadows for modern feel
    sm: Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
      default: {},
    }),
    // Special shadow for floating elements
    float: Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
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
