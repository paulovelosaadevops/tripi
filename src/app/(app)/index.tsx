import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripsSkeleton } from '@/components/skeleton';
import { NextTripCard, TripRow } from '@/components/trip-cards';
import { Button, FloatingButton, IconButton } from '@/components/ui/button';
import { TripiMark } from '@/components/ui/icon';
import { ErrorView, Screen, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useChecklist } from '@/data/trip-content';
import { groupTrips, useProfile, useTrips } from '@/data/trips';
import { firstName, initials, toISODate } from '@/lib/format';
import type { Trip } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

const openTrip = (trip: Trip) => router.push({ pathname: '/viagem/[id]', params: { id: trip.id } });

export default function MyTripsScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const profile = useProfile(session?.user.id);
  const trips = useTrips();
  const name = firstName(profile.data?.name ?? '');
  const groups = trips.data ? groupTrips(trips.data, toISODate(new Date())) : null;
  const isEmpty = trips.data?.length === 0;

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <Screen
        bottomSpace={110}
        refreshControl={<RefreshControl refreshing={trips.isRefetching} onRefresh={() => void trips.refetch()} tintColor={colors.accent} />}
        header={
          <View style={styles.header}>
            <View style={styles.flex}>
              <AppText variant="small" weight="semibold" tone="muted">
                {name ? `Olá, ${name}` : 'Olá'}
              </AppText>
              <AppText variant="title" accessibilityRole="header">
                Minhas viagens
              </AppText>
            </View>
            <IconButton icon="user" label={`Perfil ${initials(profile.data?.name ?? '')}`} onPress={() => router.push('/perfil')} />
          </View>
        }>
        {trips.isPending && <TripsSkeleton />}
        {trips.isError && <ErrorView message="Não conseguimos carregar suas viagens." onRetry={() => trips.refetch()} />}
        {isEmpty && <FirstTrip />}
        {groups && !isEmpty && (
          <>
            {groups.next && (
              <View style={styles.section}>
                <SectionTitle>Próxima viagem</SectionTitle>
                <NextTripWithChecklist trip={groups.next} />
              </View>
            )}
            {groups.upcoming.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>Depois</SectionTitle>
                {groups.upcoming.map((trip) => (
                  <TripRow key={trip.id} trip={trip} onPress={() => openTrip(trip)} />
                ))}
              </View>
            )}
            {groups.planning.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>Planejando</SectionTitle>
                {groups.planning.map((trip) => (
                  <TripRow key={trip.id} trip={trip} onPress={() => openTrip(trip)} />
                ))}
              </View>
            )}
            {groups.past.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>Anteriores</SectionTitle>
                {groups.past.map((trip) => (
                  <TripRow key={trip.id} trip={trip} past onPress={() => openTrip(trip)} />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
      {/* Mesmo botão flutuante das outras telas ("+ Gasto", "+ Atividade"). */}
      {!isEmpty && <FloatingButton label="Viagem" bottom={insets.bottom + 24} onPress={() => router.push('/nova-viagem')} />}
    </View>
  );
}

function NextTripWithChecklist({ trip }: { trip: Trip }) {
  const checklist = useChecklist(trip.id);
  const items = checklist.data ?? [];
  return (
    <NextTripCard
      trip={trip}
      onPress={() => openTrip(trip)}
      checklist={{ done: items.filter((i) => i.done).length, total: items.length }}
    />
  );
}

/** Estado vazio do primeiro uso (tela 18 do protótipo). */
function FirstTrip() {
  const { colors } = useAppTheme();
  const tips = [
    { n: '1', title: 'Monte o roteiro', sub: 'Atividades organizadas dia a dia', tint: colors.green },
    { n: '2', title: 'Guarde as reservas', sub: 'Voos, hotéis e ingressos num lugar', tint: colors.blue },
    { n: '3', title: 'Divida os gastos', sub: 'Orçamento e quem pagou o quê', tint: colors.orange },
  ];
  return (
    <View style={styles.empty}>
      <Surface radius={48} style={styles.emptyMark}>
        <TripiMark size={88} color={colors.accent} />
      </Surface>
      <AppText variant="title" style={styles.center}>
        Sua primeira viagem começa aqui
      </AppText>
      <AppText tone="muted" style={styles.center}>
        Crie uma viagem para montar o roteiro, guardar reservas e controlar os gastos, tudo salvo na nuvem.
      </AppText>
      <Button label="Criar minha primeira viagem" onPress={() => router.push('/nova-viagem')} style={styles.stretch} />
      <Surface style={styles.tips}>
        {tips.map((tip) => (
          <View key={tip.n} style={styles.tip}>
            <View style={[styles.tipBadge, { backgroundColor: tip.tint.bg }]}>
              <AppText variant="small" weight="extrabold" color={tip.tint.fg}>
                {tip.n}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="small" weight="extrabold">
                {tip.title}
              </AppText>
              <AppText variant="small" tone="muted">
                {tip.sub}
              </AppText>
            </View>
          </View>
        ))}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  section: { gap: 12, marginTop: 8 },
  empty: { alignItems: 'center', gap: 16, paddingTop: 16 },
  emptyMark: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  tips: { alignSelf: 'stretch', paddingVertical: 4 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  tipBadge: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
