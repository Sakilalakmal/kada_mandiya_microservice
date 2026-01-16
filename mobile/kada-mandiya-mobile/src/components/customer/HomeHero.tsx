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
      variant="tinted"
      style={[
        styles.card,
        {
          borderRadius: theme.radius.lg,
          padding: theme.spacing.xl,
        },
      ]}
    >
      {/* Text content */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontWeight: '700',
            fontSize: theme.typography.h2,
            lineHeight: theme.typography.h2 * theme.typography.lineHeight.tight,
          }}
        >
          Discover Local Artisan Goods
        </Text>
        <Text
          style={{
            color: theme.colors.foregroundSecondary,
            fontWeight: '400',
            fontSize: theme.typography.body,
            lineHeight: theme.typography.body * theme.typography.lineHeight.normal,
          }}
        >
          Support local vendors, get fresh finds delivered fast
        </Text>
      </View>

      {/* CTA */}
      <View style={{ marginTop: theme.spacing.md }}>
        <Button
          label="Browse Products"
          onPress={onBrowseProducts}
          size="md"
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
});
