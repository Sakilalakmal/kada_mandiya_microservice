import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  label: string;
  accent: string;
  backgroundColor: string;
  borderColor: string;
  style?: ViewStyle;
};

function StatusPillInner({ label, accent, backgroundColor, borderColor, style }: Props) {
  const { theme } = useTheme();

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor,
      borderColor,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
    }),
    [backgroundColor, borderColor, theme.radius.lg, theme.spacing.sm, theme.spacing.xs]
  );

  return (
    <View style={[styles.pill, containerStyle, style]}>
      <Text style={[styles.text, { color: accent, fontSize: theme.typography.small }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export const StatusPill = memo(StatusPillInner);

const styles = StyleSheet.create({
  pill: { borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontWeight: '800', letterSpacing: 0.3 },
});

