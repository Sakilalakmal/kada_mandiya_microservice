import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '../ui/Card';
import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  imageUrls: string[];
};

export function ProductImages({ imageUrls }: Props) {
  const { theme } = useTheme();
  const urls = useMemo(() => imageUrls.filter((u) => typeof u === 'string' && u.trim().length > 0), [imageUrls]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeUrl = urls[activeIndex] ?? urls[0] ?? null;
  const heroHeight = 240;
  const thumbSize = 56;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View
          style={{
            height: heroHeight,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeUrl ? (
            <Image source={{ uri: activeUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
              <Feather name="image" size={20} color={theme.colors.placeholder} />
              <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
                No images
              </Text>
            </View>
          )}
        </View>
      </Card>

      {urls.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
          {urls.map((url, idx) => {
            const selected = idx === activeIndex;
            return (
              <Pressable
                key={`${url}-${idx}`}
                onPress={() => setActiveIndex(idx)}
                style={({ pressed }) => [
                  {
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`View image ${idx + 1}`}
              >
                <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

