import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Variant = 'primary' | 'outline' | 'ghost';
type Intent = 'default' | 'danger';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  intent?: Intent;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  intent = 'default',
  loading,
  disabled,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const controlHeight = theme.spacing.xl + theme.spacing.md;

  const stylesByVariant = useMemo(() => {
    const intentColor = intent === 'danger' ? theme.colors.danger : theme.colors.primary;

    switch (variant) {
      case 'outline':
        if (intent === 'danger') {
          return {
            backgroundColor: 'transparent',
            borderColor: theme.colors.danger,
            textColor: theme.colors.danger,
          };
        }
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          textColor: theme.colors.foreground,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: intentColor,
        };
      case 'primary':
      default:
        return {
          backgroundColor: intentColor,
          borderColor: intentColor,
          textColor: theme.colors.primaryForeground,
        };
    }
  }, [intent, theme, variant]);

  const isDisabled = disabled || loading;
  const containerStyle: ViewStyle = {
    height: controlHeight,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  };

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
          containerStyle,
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
          <Text
            style={[
              styles.label,
              { color: stylesByVariant.textColor, fontSize: theme.typography.body },
            ]}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '800' },
});
