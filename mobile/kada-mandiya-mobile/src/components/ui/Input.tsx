import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  inputRef?: React.Ref<TextInput>;
};

export function Input({ label, error, leadingIcon, inputRef, style, ...props }: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const controlHeight = theme.spacing.xl + theme.spacing.md;
  const isMultiline = Boolean(props.multiline);
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const hasLeadingIcon = Boolean(leadingIcon);
  const iconSize = 18;
  const iconInset = theme.spacing.md;
  const iconPadding = hasLeadingIcon ? iconInset + iconSize + theme.spacing.sm : 0;

  const inputStyle: TextStyle = useMemo(() => {
    return {
      height: isMultiline ? undefined : controlHeight,
      minHeight: isMultiline ? controlHeight * 2 : controlHeight,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingLeft: theme.spacing.md + iconPadding,
      paddingVertical: isMultiline ? theme.spacing.sm : 0,
      fontSize: theme.typography.body,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      borderColor,
      textAlignVertical: isMultiline ? 'top' : 'center',
    } as const;
  }, [
    borderColor,
    controlHeight,
    iconPadding,
    isMultiline,
    theme.colors.foreground,
    theme.colors.muted,
    theme.radius.md,
    theme.spacing.md,
    theme.spacing.sm,
    theme.typography.body,
  ]);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.foreground, fontSize: theme.typography.small }]}>
          {label}
        </Text>
      ) : null}
      <View style={styles.control}>
        {leadingIcon ? (
          <View style={[styles.leadingIcon, { left: iconInset }]} pointerEvents="none">
            {leadingIcon}
          </View>
        ) : null}
        <TextInput
          ref={inputRef}
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
      </View>
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
  control: { position: 'relative' },
  leadingIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
  error: { fontWeight: '600' },
});
