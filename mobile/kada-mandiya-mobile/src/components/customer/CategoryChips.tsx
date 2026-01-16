import React, { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

export type CategoryChip = {
  key: string;
  label: string;
};

type Props = {
  items: CategoryChip[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: ViewStyle;
};

function Chip({
  item,
  selected,
  onPress,
}: {
  item: CategoryChip;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
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
      bounciness: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            transform: [{ scale }],
            borderRadius: theme.radius.lg,
            borderWidth: 0,
            backgroundColor: selected ? theme.colors.primary : theme.colors.card,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            height: 42,
            justifyContent: 'center',
            ...( selected ? theme.shadow.md : theme.shadow.sm),
          },
        ]}
      >
        <Text
          style={{
            color: selected ? theme.colors.primaryForeground : theme.colors.foreground,
            fontWeight: '700',
            fontSize: theme.typography.bodySmall,
            letterSpacing: 0.3,
          }}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CategoryChips({ items, selectedKey, onSelect, style }: Props) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { gap: theme.spacing.sm, paddingRight: theme.spacing.md }, style]}
    >
      {items.map((item) => (
        <Chip
          key={item.key}
          item={item}
          selected={item.key === selectedKey}
          onPress={() => onSelect(item.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  chip: {
    borderWidth: 1,
  },
});
