import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Variant = 'default' | 'elevated' | 'bordered' | 'ghost' | 'tinted';

type Props = ViewProps & {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

export function Card({ children, variant = 'default', style, noPadding = false, ...props }: Props) {
  const { theme } = useTheme();

  const variantStyles = React.useMemo(() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.cardElevated,
          borderWidth: 0,
          ...theme.shadow.lg,
        };
      case 'bordered':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadow.none,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          ...theme.shadow.none,
        };
      case 'tinted':
        return {
          backgroundColor: theme.colors.cardTinted,
          borderWidth: 0,
          ...theme.shadow.none,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 0,
          ...theme.shadow.md,
        };
    }
  }, [variant, theme]);

  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          borderRadius: theme.radius.xl,
          padding: noPadding ? 0 : theme.spacing.md,
        },
        variantStyles,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
