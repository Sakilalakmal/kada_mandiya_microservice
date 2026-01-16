import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  selected?: boolean;
  icon?: React.ReactNode;
};

export function Chip({
  label,
  variant = 'default',
  size = 'md',
  selected = false,
  icon,
  disabled,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const sizeConfig = React.useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          height: 32,
          paddingHorizontal: theme.spacing.md,
          fontSize: theme.typography.caption,
          borderRadius: theme.radius.md,
        };
      case 'lg':
        return {
          height: 44,
          paddingHorizontal: theme.spacing.xl,
          fontSize: theme.typography.body,
          borderRadius: theme.radius.lg,
        };
      case 'md':
      default:
        return {
          height: 38,
          paddingHorizontal: theme.spacing.lg,
          fontSize: theme.typography.bodySmall,
          borderRadius: theme.radius.lg,
        };
    }
  }, [size, theme]);

  const colorConfig = React.useMemo(() => {
    if (selected) {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: theme.colors.primary,
            textColor: theme.colors.primaryForeground,
            borderColor: theme.colors.primary,
          };
        case 'success':
          return {
            backgroundColor: theme.colors.success,
            textColor: theme.colors.successForeground,
            borderColor: theme.colors.success,
          };
        case 'warning':
          return {
            backgroundColor: theme.colors.warning,
            textColor: theme.colors.warningForeground,
            borderColor: theme.colors.warning,
          };
        case 'danger':
          return {
            backgroundColor: theme.colors.danger,
            textColor: theme.colors.dangerForeground,
            borderColor: theme.colors.danger,
          };
        case 'default':
        default:
          return {
            backgroundColor: theme.colors.foreground,
            textColor: theme.colors.background,
            borderColor: theme.colors.foreground,
          };
      }
    }

    // Unselected state
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primaryMuted,
          textColor: theme.colors.primary,
          borderColor: theme.colors.primaryMuted,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.successMuted,
          textColor: theme.colors.success,
          borderColor: theme.colors.successMuted,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warningMuted,
          textColor: theme.colors.warning,
          borderColor: theme.colors.warningMuted,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.dangerMuted,
          textColor: theme.colors.danger,
          borderColor: theme.colors.dangerMuted,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.muted,
          textColor: theme.colors.foreground,
          borderColor: theme.colors.border,
        };
    }
  }, [selected, variant, theme]);

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: sizeConfig.borderRadius,
    borderWidth: 1,
    borderColor: colorConfig.borderColor,
    backgroundColor: colorConfig.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  };

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      onPressIn={(e) => {
        props.onPressIn?.(e);
        if (!disabled) animateIn();
      }}
      onPressOut={(e) => {
        props.onPressOut?.(e);
        if (!disabled) animateOut();
      }}
      {...props}
      style={[typeof style === 'function' ? undefined : style]}
    >
      <Animated.View
        style={[
          containerStyle,
          theme.shadow.sm,
          {
            transform: [{ scale }],
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {icon}
        <Text
          style={[
            styles.label,
            {
              color: colorConfig.textColor,
              fontSize: sizeConfig.fontSize,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
