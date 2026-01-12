import React from 'react';
import { Alert, View } from 'react-native';

import { Button } from '../ui/Button';
import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  isActive: boolean;
  onEdit: () => void;
  onDeactivate: () => Promise<void> | void;
  onReactivate: () => Promise<void> | void;
  busy?: boolean;
};

export function ProductActions({ isActive, onEdit, onDeactivate, onReactivate, busy }: Props) {
  const { theme } = useTheme();

  const confirmToggle = () => {
    Alert.alert(
      isActive ? 'Deactivate product?' : 'Reactivate product?',
      `Are you sure? This will ${isActive ? 'hide' : 'show'} the product to customers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Deactivate' : 'Reactivate',
          style: isActive ? 'destructive' : 'default',
          onPress: () => (isActive ? onDeactivate() : onReactivate()),
        },
      ]
    );
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Button label="Edit product" onPress={onEdit} disabled={busy} />
      <Button
        label={isActive ? 'Deactivate' : 'Reactivate'}
        variant="outline"
        onPress={confirmToggle}
        disabled={busy}
        loading={busy}
      />
    </View>
  );
}

