import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '../../../../src/components/layout/Screen';
import { Header } from '../../../../src/components/layout/Header';
import { Card } from '../../../../src/components/ui/Card';
import { Badge } from '../../../../src/components/ui/Badge';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function VendorDashboard() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const gap = theme.spacing.sm;
  const horizontalPadding = theme.spacing.md;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - gap) / 2);

  return (
    <Screen scroll>
      <Header title="Vendor Dashboard" subtitle="Manage your store and products." />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          <Pressable
            onPress={() => router.push('/(app)/(vendor)/products')}
            style={({ pressed }) => [{ width: cardWidth, opacity: pressed ? 0.92 : 1 }]}
          >
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    color: theme.colors.placeholder,
                    fontWeight: '800',
                    fontSize: theme.typography.small,
                  }}
                >
                  Products
                </Text>
                <Feather name="package" size={18} color={theme.colors.placeholder} />
              </View>
              <Text
                style={{
                  marginTop: theme.spacing.sm,
                  color: theme.colors.foreground,
                  fontWeight: '900',
                  fontSize: theme.typography.title + theme.spacing.xs / 2,
                }}
              >
                —
              </Text>
              <Text
                style={{
                  marginTop: theme.spacing.xs,
                  color: theme.colors.placeholder,
                  fontWeight: '600',
                  fontSize: theme.typography.small,
                }}
              >
                View & create
              </Text>
            </Card>
          </Pressable>

          <Card style={{ width: cardWidth }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                Orders
              </Text>
              <Feather name="shopping-bag" size={18} color={theme.colors.placeholder} />
            </View>
            <Text
              style={{
                marginTop: theme.spacing.sm,
                color: theme.colors.foreground,
                fontWeight: '900',
                fontSize: theme.typography.title + theme.spacing.xs / 2,
              }}
            >
              —
            </Text>
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
              Coming soon
            </Text>
          </Card>

          <Card style={{ width: cardWidth }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                Revenue
              </Text>
              <Feather name="trending-up" size={18} color={theme.colors.placeholder} />
            </View>
            <Text
              style={{
                marginTop: theme.spacing.sm,
                color: theme.colors.foreground,
                fontWeight: '900',
                fontSize: theme.typography.title + theme.spacing.xs / 2,
              }}
            >
              —
            </Text>
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
              Coming soon
            </Text>
          </Card>

          <Card style={{ width: cardWidth }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                Store status
              </Text>
              <Feather name="shield" size={18} color={theme.colors.placeholder} />
            </View>
            <View style={{ marginTop: theme.spacing.sm }}>
              <Badge label="ACTIVE" />
            </View>
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
              Approved vendor
            </Text>
          </Card>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.subtitle }}>
              Quick tips
            </Text>
            <Feather name="info" size={18} color={theme.colors.placeholder} />
          </View>
          <Text style={{ marginTop: theme.spacing.sm, color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            This dashboard is ready for real metrics when the next endpoints are connected.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

