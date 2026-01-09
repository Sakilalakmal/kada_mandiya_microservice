import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { getTheme, type AppTheme, type ColorScheme } from '../constants/theme';

type ThemeContextValue = {
  scheme: ColorScheme;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(() => {
    return { scheme, theme: getTheme(scheme) };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}

