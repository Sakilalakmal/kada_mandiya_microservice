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

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type Intent = 'default' | 'danger' | 'success';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  intent?: Intent;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  intent = 'default',
  loading,
  disabled,
  fullWidth,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          height: 44,
          paddingHorizontal: theme.spacing.lg,
          fontSize: theme.typography.bodySmall,
          borderRadius: theme.radius.lg,
        };
      case 'lg':
        return {
          height: 60,
          paddingHorizontal: theme.spacing.xxl,
          fontSize: theme.typography.bodyLarge,
          borderRadius: theme.radius.xl,
        };
      case 'md':
      default:
        return {
          height: 52,
          paddingHorizontal: theme.spacing.xl,
          fontSize: theme.typography.body,
          borderRadius: theme.radius.lg,
        };
    }
  }, [size, theme]);

  const stylesByVariant = useMemo(() => {
    let intentColor: string = theme.colors.primary;
    let intentForeground: string = theme.colors.primaryForeground;

    if (intent === 'danger') {
      intentColor = theme.colors.danger;
      intentForeground = theme.colors.dangerForeground;
    } else if (intent === 'success') {
      intentColor = theme.colors.success;
      intentForeground = theme.colors.successForeground;
    }

    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
          textColor: theme.colors.foreground,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: intentColor,
          textColor: intentColor,
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
          textColor: intentForeground,
        };
    }
  }, [intent, theme, variant]);

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    borderWidth: variant === 'ghost' ? 0 : 1,
    borderRadius: sizeConfig.borderRadius,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    ...(fullWidth && { width: '100%' }),
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 60,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPressIn={(e) => {
        props.onPressIn?.(e);
        if (!isDisabled) animateIn();
      }}
      onPressOut={(e) => {
        props.onPressOut?.(e);
        if (!isDisabled) animateOut();
      }}
      {...props}
      style={[
        typeof style === 'function' ? undefined : style,
        fullWidth && { width: '100%' },
      ]}
    >
      <Animated.View
        style={[
          containerStyle,
          theme.shadow.sm,
          {
            transform: [{ scale }],
            backgroundColor: stylesByVariant.backgroundColor,
            borderColor: stylesByVariant.borderColor,
          },
          !isDisabled && { opacity },
          isDisabled && { opacity: 0.5 },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={stylesByVariant.textColor} />
        ) : (
          <Text
            style={[
              styles.label,
              {
                color: stylesByVariant.textColor,
                fontSize: sizeConfig.fontSize,
              },
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
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
