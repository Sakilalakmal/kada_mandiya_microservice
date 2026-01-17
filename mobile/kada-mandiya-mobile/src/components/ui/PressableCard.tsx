import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = PressableProps & {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'tinted';
  noPadding?: boolean;
};

export function PressableCard({
  children,
  variant = 'default',
  noPadding = false,
  disabled,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const variantStyles = React.useMemo(() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.cardElevated,
          ...theme.shadow.md,
        };
      case 'tinted':
        return {
          backgroundColor: theme.colors.cardTinted,
          ...theme.shadow.sm,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.card,
          ...theme.shadow.sm,
        };
    }
  }, [variant, theme]);

  const containerStyle: ViewStyle = {
    borderRadius: theme.radius.xl,
    padding: noPadding ? 0 : theme.spacing.lg,
    overflow: 'hidden',
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
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
        bounciness: 8,
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
      style={[
        typeof style === 'function' ? undefined : style,
      ]}
    >
      <Animated.View
        style={[
          containerStyle,
          variantStyles,
          {
            transform: [{ scale }],
            opacity,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
