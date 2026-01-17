import React, { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, type ViewStyle } from 'react-native';

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
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
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
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: selected ? theme.colors.primaryDark : theme.colors.borderSubtle,
            backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.card,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            height: 36,
            justifyContent: 'center',
            ...theme.shadow.sm,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? theme.colors.primaryDark : theme.colors.foreground,
            fontWeight: '700',
            fontSize: theme.typography.bodySmall,
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
