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
  const backSize = theme.spacing.xl + theme.spacing.xs / 2;

  return (
    <View
      style={[
        styles.wrap,
        {
          gap: theme.spacing.sm,
          paddingTop: theme.spacing.xs / 2,
          paddingBottom: theme.spacing.xs / 2,
        },
        style,
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={backHitSlop}
            onPress={() => router.back()}
            onPressIn={() => {
              Animated.timing(scale, { toValue: 0.96, duration: 120, useNativeDriver: true }).start();
            }}
            onPressOut={() => {
              Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
            }}
            style={({ pressed }) => [
              styles.back,
              { width: backSize, height: backSize, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Feather name="chevron-left" size={22} color={theme.colors.foreground} />
            </Animated.View>
          </Pressable>
        ) : null}

        <View style={styles.text}>
          <Text style={[styles.title, { color: theme.colors.foreground, fontSize: theme.typography.title }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.placeholder,
                  fontSize: theme.typography.body,
                  marginTop: theme.spacing.xs / 2,
                },
              ]}
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
  row: { flexDirection: 'row', alignItems: 'center' },
  back: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  title: { fontWeight: '800' },
  subtitle: { fontWeight: '600' },
});
