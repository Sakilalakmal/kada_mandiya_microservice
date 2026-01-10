import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const controlHeight = theme.spacing.xl + theme.spacing.md;
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const inputStyle: ViewStyle = useMemo(() => {
    return {
      height: controlHeight,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.body,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      borderColor,
    } as const;
  }, [
    borderColor,
    controlHeight,
    theme.colors.foreground,
    theme.colors.muted,
    theme.radius.md,
    theme.spacing.md,
    theme.typography.body,
  ]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.colors.foreground, fontSize: theme.typography.small }]}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.placeholder}
        onFocus={(e) => {
          props.onFocus?.(e);
          setFocused(true);
        }}
        onBlur={(e) => {
          props.onBlur?.(e);
          setFocused(false);
        }}
        style={[inputStyle, style]}
        {...props}
      />
      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger, fontSize: theme.typography.small }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontWeight: '700' },
  error: { fontWeight: '600' },
});

