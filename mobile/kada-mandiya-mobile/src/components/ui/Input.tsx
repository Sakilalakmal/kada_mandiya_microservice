import React, { useMemo, useState } from 'react';
import {
  Animated,
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
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  inputRef?: React.Ref<TextInput>;
};

export function Input({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  inputRef,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const controlHeight = 48;
  const isMultiline = Boolean(props.multiline);
  
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const iconSize = 20;
  const iconInset = theme.spacing.md;
  const iconPadding = hasLeadingIcon ? iconInset + iconSize + theme.spacing.sm : 0;
  const trailingPadding = hasTrailingIcon ? iconInset + iconSize + theme.spacing.sm : 0;

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const animatedBorderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const inputStyle: TextStyle = useMemo(() => {
    return {
      height: isMultiline ? undefined : controlHeight,
      minHeight: isMultiline ? controlHeight * 2 : controlHeight,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingLeft: theme.spacing.md + iconPadding,
      paddingRight: theme.spacing.md + trailingPadding,
      paddingVertical: isMultiline ? theme.spacing.md : 0,
      fontSize: theme.typography.body,
      color: theme.colors.foreground,
      backgroundColor: focused ? theme.colors.background : theme.colors.muted,
      textAlignVertical: isMultiline ? 'top' : 'center',
    } as const;
  }, [
    controlHeight,
    iconPadding,
    trailingPadding,
    isMultiline,
    focused,
    theme.colors.foreground,
    theme.colors.muted,
    theme.colors.background,
    theme.radius.md,
    theme.spacing.md,
    theme.typography.body,
  ]);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.danger : theme.colors.foreground,
              fontSize: theme.typography.caption,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View style={styles.control}>
        {leadingIcon ? (
          <View style={[styles.leadingIcon, { left: iconInset }]} pointerEvents="none">
            {leadingIcon}
          </View>
        ) : null}
        {trailingIcon ? (
          <View style={[styles.trailingIcon, { right: iconInset }]} pointerEvents="none">
            {trailingIcon}
          </View>
        ) : null}
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderWidth: animatedBorderWidth,
              borderColor,
              borderRadius: theme.radius.md,
            },
          ]}
        >
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
        </Animated.View>
      </View>
      {error ? (
        <Text
          style={[
            styles.helperText,
            {
              color: theme.colors.danger,
              fontSize: theme.typography.caption,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.helperText,
            {
              color: theme.colors.mutedForeground,
              fontSize: theme.typography.caption,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  control: { position: 'relative' },
  inputWrapper: {
    overflow: 'hidden',
  },
  leadingIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  trailingIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontWeight: '600',
  },
  helperText: {
    fontWeight: '500',
  },
});
