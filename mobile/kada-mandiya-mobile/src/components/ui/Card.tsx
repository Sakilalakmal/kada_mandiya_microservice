import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = ViewProps & {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style, ...props }: Props) {
  const { theme } = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,
        theme.shadow,
        {
          backgroundColor: theme.colors.muted,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
