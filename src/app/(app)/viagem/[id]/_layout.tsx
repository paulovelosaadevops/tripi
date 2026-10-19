import { Stack, useLocalSearchParams } from 'expo-router';

import { useRates } from '@/data/exchange';
import { useSettlements } from '@/data/settle';
import { useActivities, useChecklist, useExpenses, useReservations, useTripRealtime } from '@/data/trip-content';
import { useContacts, useDocuments, useNotes } from '@/data/trip-extras';
import { useTrip, useTripMembers } from '@/data/trips';
import { useTripWeather } from '@/data/weather';
import { TripIdProvider } from '@/providers/trip-id';

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useTripRealtime(id);
  useWholeTripCached(id);

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
        <Stack.Screen name="carteira" />
        <Stack.Screen name="emergencia" />
      </Stack>
    </TripIdProvider>
  );
}

/**
 * Modo offline: ao abrir a viagem, carrega todas as listas (não só as da aba aberta). Assim, tudo o que é da
 * viagem fica salvo no aparelho e abre depois sem internet — inclusive a cotação para converter os gastos.
 */
function useWholeTripCached(id: string) {
  const trip = useTrip(id);
  useTripMembers(id);
  useActivities(id);
  useReservations(id);
  useExpenses(id);
  useChecklist(id);
  useContacts(id);
  useNotes(id);
  useDocuments(id);
  useSettlements(id);
  useRates(trip.data?.local_currency);
  useTripWeather(trip.data?.destinations);
}
