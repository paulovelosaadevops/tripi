import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="criar-conta" />
      <Stack.Screen name="esqueci-senha" />
    </Stack>
  );
}
