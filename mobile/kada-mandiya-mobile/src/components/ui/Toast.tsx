import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

export function Toast({ visible, message, actionLabel, onAction, onDismiss }: Props) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) setRendered(true);

    Animated.parallel([
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: visible ? 0 : 12, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      if (!visible) setRendered(false);
    });
  }, [opacity, translateY, visible]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      theme.shadow,
      {
        backgroundColor: theme.colors.foreground,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        left: theme.spacing.md,
        right: theme.spacing.md,
        bottom: theme.spacing.md,
      },
    ],
    [theme]
  );

  if (!rendered) return null;

  return (
    <Animated.View style={[containerStyle, { opacity, transform: [{ translateY }] }]}>
      <Pressable onPress={onDismiss} style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.background, fontWeight: '800' }}>{message}</Text>
      </Pressable>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [{ opacity: pressed ? 0.86 : 1, marginLeft: theme.spacing.md }]}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
