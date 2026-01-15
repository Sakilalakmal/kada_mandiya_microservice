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
  const { theme, scheme } = useTheme();

  const isDark = scheme === 'dark';
  const bgColor = isDark ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.05)';

  return (
    <Card
      variant="elevated"
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderRadius: theme.radius.lg,
          padding: 0,
          overflow: 'hidden',
        },
      ]}
    >
      {/* Decorative circles */}
      <View style={styles.glowWrap} pointerEvents="none">
        <View
          style={[
            styles.glow,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.glow2,
            {
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.06)',
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        {/* Icon badge */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadow.md,
          }}
        >
          <Feather name="shopping-bag" size={24} color={theme.colors.primaryForeground} />
        </View>

        {/* Text content */}
        <View style={{ gap: theme.spacing.xs }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontWeight: '800',
              fontSize: theme.typography.h3,
              lineHeight: theme.typography.h3 * theme.typography.lineHeight.tight,
              letterSpacing: -0.5,
            }}
          >
            Discover Local{'\n'}Artisan Goods
          </Text>
          <Text
            style={{
              color: theme.colors.foregroundSecondary,
              fontWeight: '500',
              fontSize: theme.typography.body,
              lineHeight: theme.typography.body * theme.typography.lineHeight.normal,
            }}
          >
            Support local vendors, get fresh finds delivered fast
          </Text>
        </View>

        {/* CTA */}
        <View style={{ marginTop: theme.spacing.xs }}>
          <Button
            label="Browse Products"
            onPress={onBrowseProducts}
            size="lg"
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -140,
    right: -100,
  },
  glow2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: -100,
    left: -80,
  },
});
