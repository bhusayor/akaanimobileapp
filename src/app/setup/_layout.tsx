import { Stack } from 'expo-router';
import { themedStyles, useColors } from '../../theme';

export default function SetupLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
