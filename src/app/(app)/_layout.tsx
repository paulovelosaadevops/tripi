import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="nova-viagem" options={{ presentation: 'modal' }} />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="aparencia" />
      <Stack.Screen name="viagem/[id]" />
      <Stack.Screen name="convite/[code]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
