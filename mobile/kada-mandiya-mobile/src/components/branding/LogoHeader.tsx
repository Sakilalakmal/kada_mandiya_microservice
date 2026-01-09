import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  subtitle?: string;
};

export function LogoHeader({ subtitle }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>
        Kada <Text style={{ color: theme.colors.primary }}>Mandiya</Text>
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontWeight: '500' },
});

