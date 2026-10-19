import { Stack, useLocalSearchParams } from 'expo-router';

import { useTripRealtime } from '@/data/trip-content';
import { TripIdProvider } from '@/providers/trip-id';

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useTripRealtime(id);

  return (
    <TripIdProvider id={id}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="atividade-nova" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reserva-nova" options={{ presentation: 'modal' }} />
        <Stack.Screen name="gasto-novo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checklist" />
        <Stack.Screen name="documentos" />
        <Stack.Screen name="documento-novo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="documento/[docId]" />
        <Stack.Screen name="contatos" />
        <Stack.Screen name="anotacoes" />
        <Stack.Screen name="anotacao" options={{ presentation: 'modal' }} />
        <Stack.Screen name="mapa" />
        <Stack.Screen name="viajantes" />
        <Stack.Screen name="configuracoes" />
        <Stack.Screen name="exportar" />
        <Stack.Screen name="cambio" />
        <Stack.Screen name="acerto" />
        <Stack.Screen name="busca" />
      </Stack>
    </TripIdProvider>
  );
}
