import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Header({ title, subtitle, canGoBack, right, style }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const backHitSlop = useMemo(() => {
    const v = theme.spacing.sm;
    return { top: v, bottom: v, left: v, right: v };
  }, [theme.spacing.sm]);

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          gap: theme.spacing.xs,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
        },
        style,
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={backHitSlop}
            onPress={() => router.back()}
            onPressIn={animateIn}
            onPressOut={animateOut}
            style={({ pressed }) => [
              styles.backButton,
              {
                width: 40,
                height: 40,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.backgroundSecondary,
                opacity: pressed ? 0.7 : 1,
                ...theme.shadow.sm,
              },
            ]}
          >
            <Animated.View style={[styles.backInner, { transform: [{ scale }] }]}>
              <Feather name="arrow-left" size={20} color={theme.colors.foreground} />
            </Animated.View>
          </Pressable>
        ) : null}

        <View style={styles.text}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.foreground,
                fontSize: theme.typography.h1,
                lineHeight: theme.typography.h1 * theme.typography.lineHeight.tight,
                letterSpacing: -0.6,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.foregroundSecondary,
                  fontSize: theme.typography.bodySmall,
                  marginTop: theme.spacing.xxs,
                  lineHeight: theme.typography.bodySmall * theme.typography.lineHeight.normal,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    fontWeight: '500',
  },
});
