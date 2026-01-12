import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  onBrowseProducts: () => void;
};

export function HomeHero({ onBrowseProducts }: Props) {
  const { theme, scheme } = useTheme();

  const heroBackground = scheme === 'dark' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.10)';
  const heroBorder = scheme === 'dark' ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.22)';

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: heroBackground,
          borderColor: heroBorder,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <View style={styles.glowWrap} pointerEvents="none">
        <View style={[styles.glow, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]} />
        <View style={[styles.glow2, { backgroundColor: 'rgba(37, 99, 235, 0.22)' }]} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: 20 }}>
          Discover local vendors
        </Text>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
          Fresh finds, fast checkout
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <Button label="Browse products" onPress={onBrowseProducts} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  glowWrap: { ...StyleSheet.absoluteFillObject },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -110,
    transform: [{ rotate: '12deg' }],
  },
  glow2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    bottom: -120,
    left: -120,
    transform: [{ rotate: '-18deg' }],
  },
});

