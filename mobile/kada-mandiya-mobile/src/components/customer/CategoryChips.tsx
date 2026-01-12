import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

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

export function CategoryChips({ items, selectedKey, onSelect, style }: Props) {
  const { theme, scheme } = useTheme();

  const selectedBg = scheme === 'dark' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(37, 99, 235, 0.12)';
  const selectedBorder = scheme === 'dark' ? 'rgba(37, 99, 235, 0.42)' : 'rgba(37, 99, 235, 0.24)';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { gap: theme.spacing.sm }, style]}
    >
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                opacity: pressed ? 0.9 : 1,
                borderRadius: theme.radius.lg,
                borderColor: selected ? selectedBorder : theme.colors.border,
                backgroundColor: selected ? selectedBg : theme.colors.muted,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? theme.colors.primary : theme.colors.foreground,
                fontWeight: '800',
                fontSize: theme.typography.small,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={{ width: 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingRight: 2 },
  chip: { borderWidth: 1 },
});

