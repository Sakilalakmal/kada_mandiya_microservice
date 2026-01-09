import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Variant = 'primary' | 'outline' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const stylesByVariant = useMemo(() => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          textColor: theme.colors.foreground,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: theme.colors.primary,
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          textColor: theme.colors.primaryForeground,
        };
    }
  }, [theme, variant]);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={(e) => {
        props.onPressIn?.(e);
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={(e) => {
        props.onPressOut?.(e);
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }}
      {...props}
      style={({ pressed }) => {
        const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style;
        return [resolvedStyle, { opacity: pressed ? 0.92 : 1 }];
      }}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale }],
            backgroundColor: stylesByVariant.backgroundColor,
            borderColor: stylesByVariant.borderColor,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={stylesByVariant.textColor} />
        ) : (
          <Text style={[styles.label, { color: stylesByVariant.textColor }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '700' },
});
