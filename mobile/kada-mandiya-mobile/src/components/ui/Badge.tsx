import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Status = 'ACTIVE' | 'PENDING' | 'REJECTED' | (string & {});

type Props = {
  label: Status;
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

export function Badge({ label, style }: Props) {
  const { theme } = useTheme();

  const accent = useMemo(() => {
    const key = label.toUpperCase();
    if (key === 'ACTIVE') return theme.colors.primary;
    if (key === 'REJECTED') return theme.colors.danger;
    if (key === 'PENDING') return theme.colors.placeholder;
    return theme.colors.placeholder;
  }, [label, theme.colors.danger, theme.colors.placeholder, theme.colors.primary]);

  const bgAlpha = theme.scheme === 'dark' ? 0.18 : 0.1;
  const borderAlpha = theme.scheme === 'dark' ? 0.35 : 0.22;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: withOpacity(accent, bgAlpha),
          borderColor: withOpacity(accent, borderAlpha),
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: accent, fontSize: theme.typography.small }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontWeight: '800', letterSpacing: 0.4 },
});

