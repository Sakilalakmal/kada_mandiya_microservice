import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  onBrowseProducts: () => void;
};

export function HomeHero({ onBrowseProducts }: Props) {
  const { theme } = useTheme();

  return (
    <Card
      variant="elevated"
      style={[
        styles.card,
        {
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.accentMuted,
            }}
          >
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.caption }}>
              Discount 25%
            </Text>
          </View>

          <Text
            style={{
              color: theme.colors.foreground,
              fontWeight: '900',
              fontSize: theme.typography.h2,
              lineHeight: theme.typography.h2 * theme.typography.lineHeight.tight,
              letterSpacing: -0.6,
            }}
          >
            Fresh finds, delivered fast
          </Text>
          <Text
            style={{
              color: theme.colors.foregroundSecondary,
              fontWeight: '600',
              fontSize: theme.typography.bodySmall,
              lineHeight: theme.typography.bodySmall * theme.typography.lineHeight.normal,
            }}
          >
            Shop local vendors and discover unique products.
          </Text>

          <View style={{ marginTop: theme.spacing.sm }}>
            <Button label="Shop now" onPress={onBrowseProducts} size="sm" style={{ alignSelf: 'flex-start' }} />
          </View>
        </View>

        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadow.sm,
            }}
          >
            <Feather name="shopping-bag" size={22} color={theme.colors.primaryForeground} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
});
