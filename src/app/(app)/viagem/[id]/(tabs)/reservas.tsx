import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { useTabBarSpace } from '@/components/trip-tab-bar';
import { FloatingButton } from '@/components/ui/button';
import { ChipGroup, Tag } from '@/components/ui/chip';
import { EmptyState, ErrorView, Screen, TabTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useReservations } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { formatDayMonth, formatMoney } from '@/lib/format';
import { ReservationKindLabels, reservationTint } from '@/lib/labels';
import type { Reservation, ReservationKind } from '@/lib/types';
import { useAppTheme } from '@/theme/theme-provider';
import { useTripId } from '@/providers/trip-id';

type Filter = 'todas' | ReservationKind;

const filters: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'voo', label: 'Voos' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'transporte', label: 'Trem/ônibus' },
  { value: 'carro', label: 'Carro' },
  { value: 'ingresso', label: 'Ingressos' },
];

function dateLabel(r: Reservation) {
  if (!r.starts_at) return '';
  const start = formatDayMonth(r.starts_at.slice(0, 10));
  if (!r.ends_at || r.ends_at.slice(0, 10) === r.starts_at.slice(0, 10)) return start;
  return `${start} – ${formatDayMonth(r.ends_at.slice(0, 10))}`;
}

function timeLabel(iso: string | null) {
  return iso ? iso.slice(11, 16) : '';
}

export default function ReservationsScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const reservations = useReservations(id);
  const { colors } = useAppTheme();
  const space = useTabBarSpace(true);
  const [filter, setFilter] = useState<Filter>('todas');
  const items = (reservations.data ?? []).filter((r) => filter === 'todas' || r.kind === filter);

  return (
    <View style={styles.flex}>
      <Screen
        bottomSpace={space.content}
        header={
          <View style={styles.header}>
            <TabTitle overline={trip.data?.name} title="Reservas" />
            <View style={styles.filters}>
              <ChipGroup options={filters} value={filter} onChange={setFilter} scroll />
            </View>
          </View>
        }>
        {reservations.isPending && (
          <>
            <SkeletonBlock height={110} radius={20} />
            <SkeletonBlock height={110} radius={20} />
          </>
        )}
        {reservations.isError && <ErrorView message="Não conseguimos carregar as reservas." onRetry={() => reservations.refetch()} />}
        {reservations.data && items.length === 0 && (
          <EmptyState
            title={filter === 'todas' ? 'Nenhuma reserva ainda' : 'Nada neste filtro'}
            message="Guarde voos, hotéis, trens e ingressos com o código de reserva para achar tudo rápido."
          />
        )}
        {items.map((r) => {
          const tint = reservationTint(colors, r.kind);
          const sub = [timeLabel(r.starts_at), r.place].filter(Boolean).join(' · ');
          return (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: '/viagem/[id]/reserva-nova', params: { id, editId: r.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${ReservationKindLabels[r.kind]}: ${r.title}, ${dateLabel(r)}`}
              accessibilityHint="Toque para editar ou excluir">
              {({ pressed }) => (
            <Surface style={[styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                <Tag label={ReservationKindLabels[r.kind]} bg={tint.bg} fg={tint.fg} />
                <AppText variant="small" weight="bold" tone="muted">
                  {dateLabel(r)}
                </AppText>
              </View>
              <AppText variant="heading" style={styles.title}>
                {r.title}
              </AppText>
              <View style={styles.cardBottom}>
                <AppText variant="small" tone="muted" style={styles.flex} numberOfLines={1}>
                  {sub || (r.amount != null && r.currency ? formatMoney(r.amount, r.currency) : '')}
                </AppText>
                {r.code && (
                  <AppText variant="small" weight="extrabold" style={styles.code} selectable>
                    {r.code}
                  </AppText>
                )}
              </View>
            </Surface>
              )}
            </Pressable>
          );
        })}
      </Screen>
      <FloatingButton label="Reserva" bottom={space.fab} onPress={() => router.push({ pathname: '/viagem/[id]/reserva-nova', params: { id } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingBottom: 4 },
  filters: { paddingLeft: 20 },
  card: { padding: 16, gap: 10 },
  pressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  code: { letterSpacing: 1 },
});
