import React, { memo, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../providers/ThemeProvider';

type Props = Omit<PressableProps, 'style'> & {
  title: string;
  subtitle?: string;
  leftIcon?: React.ComponentProps<typeof Feather>['name'];
  rightText?: string;
  rightBadge?: React.ReactNode;
  showChevron?: boolean;
  containerStyle?: ViewStyle;
};

function ListItemInner({
  title,
  subtitle,
  leftIcon,
  rightText,
  rightBadge,
  showChevron,
  containerStyle,
  disabled,
  onPress,
  ...props
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || !onPress;
  const shouldShowChevron = showChevron ?? Boolean(onPress);

  const hitSlop = useMemo(() => {
    const v = theme.spacing.sm;
    return { top: v, bottom: v, left: v, right: v };
  }, [theme.spacing.sm]);

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={hitSlop}
      onPressIn={(e) => {
        props.onPressIn?.(e);
        Animated.timing(scale, { toValue: 0.985, duration: 110, useNativeDriver: true }).start();
      }}
      onPressOut={(e) => {
        props.onPressOut?.(e);
        Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }).start();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Animated.View
        style={[
          styles.row,
          {
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            opacity: isDisabled ? 0.6 : 1,
            transform: [{ scale }],
          },
          containerStyle,
        ]}
      >
        {leftIcon ? (
          <View style={[styles.icon, { borderColor: theme.colors.border }]}>
            <Feather name={leftIcon} size={18} color={theme.colors.foreground} />
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                marginTop: theme.spacing.xs / 2,
                color: theme.colors.placeholder,
                fontWeight: '600',
                fontSize: theme.typography.small,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.right, { gap: theme.spacing.xs }]}>
          {rightBadge ?? null}
          {rightText ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
              {rightText}
            </Text>
          ) : null}
          {shouldShowChevron ? <Feather name="chevron-right" size={20} color={theme.colors.placeholder} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const ListItem = memo(ListItemInner);

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

