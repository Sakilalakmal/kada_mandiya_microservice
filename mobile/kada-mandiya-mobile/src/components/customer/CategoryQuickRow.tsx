import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../providers/ThemeProvider';

export type CategoryQuickItem = {
  key: string;
  label: string;
};

type Props = {
  items: CategoryQuickItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: ViewStyle;
};

function iconForCategory(key: string): React.ComponentProps<typeof Feather>['name'] {
  const k = key.toLowerCase();
  if (k === 'all') return 'grid';
  if (k.includes('home')) return 'home';
  if (k.includes('fashion')) return 'shopping-bag';
  if (k.includes('art')) return 'image';
  if (k.includes('food')) return 'coffee';
  if (k.includes('decor')) return 'feather';
  return 'tag';
}

function Item({
  item,
  selected,
  onPress,
}: {
  item: CategoryQuickItem;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: 90, useNativeDriver: true }).start();
  };

  const animateOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }).start();
  };

  const icon = useMemo(() => iconForCategory(item.key), [item.key]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', width: 72 }}>
        <View
          style={[
            styles.circle,
            {
              borderRadius: theme.radius.xl,
              backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.backgroundSecondary,
              ...theme.shadow.sm,
            },
          ]}
        >
          <Feather name={icon} size={18} color={selected ? theme.colors.primaryDark : theme.colors.foreground} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            marginTop: theme.spacing.xs,
            color: selected ? theme.colors.primaryDark : theme.colors.foregroundSecondary,
            fontWeight: selected ? '800' : '700',
            fontSize: theme.typography.caption,
          }}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CategoryQuickRow({ items, selectedKey, onSelect, style }: Props) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }, style]}
    >
      {items.map((item) => (
        <Item
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
  row: {
    flexDirection: 'row',
  },
  circle: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

