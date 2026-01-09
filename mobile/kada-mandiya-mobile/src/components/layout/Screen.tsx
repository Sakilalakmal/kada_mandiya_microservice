import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Screen({ children, style }: Props) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.container,
          { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
});

