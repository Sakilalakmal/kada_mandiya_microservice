import { Alert, Platform, ToastAndroid } from 'react-native';

export function showToast(message: string) {
  const text = message.trim();
  if (!text) return;

  if (Platform.OS === 'android') {
    ToastAndroid.showWithGravity(text, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
    return;
  }

  Alert.alert('', text);
}

