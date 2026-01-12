import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '../../../src/components/layout/Screen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/providers/ThemeProvider';

function StatTile(props: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  accent?: 'primary' | 'muted';
  right?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPressable = Boolean(props.onPress);

  const accentBg = props.accent === 'primary' ? theme.colors.primary : theme.colors.background;
  const accentBorder = props.accent === 'primary' ? theme.colors.primary : theme.colors.border;
  const iconColor = props.accent === 'primary' ? theme.colors.primaryForeground : theme.colors.placeholder;
  const titleColor = props.accent === 'primary' ? theme.colors.primaryForeground : theme.colors.placeholder;
  const valueColor = props.accent === 'primary' ? theme.colors.primaryForeground : theme.colors.foreground;
  const subtitleColor = props.accent === 'primary' ? theme.colors.primaryForeground : theme.colors.placeholder;

  return (
    <Pressable
      disabled={!isPressable}
      onPress={props.onPress}
      onPressIn={() => Animated.timing(scale, { toValue: 0.985, duration: 110, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }).start()}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Card style={{ backgroundColor: accentBg, borderColor: accentBorder }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: titleColor, fontWeight: '800', fontSize: theme.typography.small }}>
              {props.title}
            </Text>
            <Feather name={props.icon} size={18} color={iconColor} />
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            {props.right ?? (
              <Text style={{ color: valueColor, fontWeight: '900', fontSize: theme.typography.title + theme.spacing.xs / 2 }}>
                —
              </Text>
            )}
          </View>
          <Text style={{ marginTop: theme.spacing.xs, color: subtitleColor, fontWeight: '600', fontSize: theme.typography.small }}>
            {props.subtitle}
          </Text>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

export default function VendorDashboardScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const gap = theme.spacing.sm;
  const horizontalPadding = theme.spacing.md;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - gap) / 2);

  const gridStyle = useMemo(() => ({ flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap }), [gap]);

  return (
    <Screen scroll>
      <Header title="Vendor dashboard" subtitle="Quick access to store tools." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <View style={gridStyle}>
          <View style={{ width: cardWidth }}>
            <StatTile
              title="Products"
              subtitle="View & manage"
              icon="package"
              accent="primary"
              onPress={() => router.push('/(app)/(vendor)/products')}
              right={
                <Text style={{ color: theme.colors.primaryForeground, fontWeight: '900', fontSize: theme.typography.title + theme.spacing.xs / 2 }}>
                  —
                </Text>
              }
            />
          </View>

          <View style={{ width: cardWidth }}>
            <StatTile title="Orders" subtitle="Coming soon" icon="shopping-bag" />
          </View>

          <View style={{ width: cardWidth }}>
            <StatTile title="Revenue" subtitle="Coming soon" icon="trending-up" />
          </View>

          <View style={{ width: cardWidth }}>
            <StatTile
              title="Store status"
              subtitle="Approved vendor"
              icon="shield"
              right={<Badge label="ACTIVE" />}
            />
          </View>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.subtitle }}>
              Quick tips
            </Text>
            <Feather name="info" size={18} color={theme.colors.placeholder} />
          </View>
          <Text style={{ marginTop: theme.spacing.sm, color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            Metrics and revenue cards will be connected as soon as the next endpoints land.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

