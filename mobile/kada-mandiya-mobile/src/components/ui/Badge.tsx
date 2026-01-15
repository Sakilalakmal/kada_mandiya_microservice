import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Status = 
  | 'ACTIVE' 
  | 'PENDING' 
  | 'REJECTED' 
  | 'COMPLETED'
  | 'PROCESSING'
  | 'CANCELLED'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | (string & {});

type Variant = 'default' | 'solid' | 'outline';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: Status;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  if (full.length !== 6) return null;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return null;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function withOpacity(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export function Badge({ label, variant = 'default', size = 'md', style }: Props) {
  const { theme } = useTheme();

  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
          fontSize: theme.typography.tiny,
          borderRadius: theme.radius.xs,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          fontSize: theme.typography.bodySmall,
          borderRadius: theme.radius.sm,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs + 1,
          fontSize: theme.typography.caption,
          borderRadius: theme.radius.xs,
        };
    }
  }, [size, theme]);

  const accent = useMemo(() => {
    const key = label.toUpperCase();
    
    // Success states
    if (key === 'ACTIVE' || key === 'COMPLETED' || key === 'SUCCESS') {
      return theme.colors.success;
    }
    
    // Warning states
    if (key === 'PENDING' || key === 'PROCESSING' || key === 'WARNING') {
      return theme.colors.warning;
    }
    
    // Error states
    if (key === 'REJECTED' || key === 'CANCELLED' || key === 'ERROR') {
      return theme.colors.danger;
    }
    
    // Default
    return theme.colors.primary;
  }, [label, theme.colors]);

  const variantStyles = useMemo(() => {
    const bgAlpha = theme.scheme === 'dark' ? 0.15 : 0.1;
    const borderAlpha = theme.scheme === 'dark' ? 0.3 : 0.2;

    switch (variant) {
      case 'solid':
        return {
          backgroundColor: accent,
          borderColor: accent,
          textColor: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: accent,
          textColor: accent,
        };
      case 'default':
      default:
        return {
          backgroundColor: withOpacity(accent, bgAlpha),
          borderColor: withOpacity(accent, borderAlpha),
          textColor: accent,
        };
    }
  }, [variant, accent, theme.scheme]);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderRadius: sizeConfig.borderRadius,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
