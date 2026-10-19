import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { daysUntil, formatDateRange, formatMonthYear } from '@/lib/format';
import type { Trip } from '@/lib/types';
import { useAppTheme } from '@/theme/theme-provider';

function countdownLabel(trip: Trip): string | null {
  if (!trip.start_date) return null;
  const days = daysUntil(trip.start_date);
  if (days > 1) return `Faltam ${days} dias`;
  if (days === 1) return 'É amanhã';
  if (days === 0) return 'É hoje';
  return 'Em viagem';
}

type NextTripCardProps = {
  trip: Trip;
  onPress: () => void;
  checklist?: { done: number; total: number };
};

/** Cartão grande da próxima viagem. */
export function NextTripCard({ trip, onPress, checklist }: NextTripCardProps) {
  const { colors } = useAppTheme();
  const countdown = countdownLabel(trip);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${trip.name}, ${formatDateRange(trip.start_date, trip.end_date)}`}>
      {({ pressed }) => (
        <Surface variant="hero" radius={26} style={[styles.hero, pressed && styles.pressed]}>
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <AppText variant="title" tone="hero">
                {trip.name}
              </AppText>
              {trip.destinations.length > 0 && (
                <AppText variant="body" weight="semibold" tone="heroMuted">
                  {trip.destinations.join(' · ')}
                </AppText>
              )}
            </View>
            {countdown && (
              <View style={[styles.pill, { backgroundColor: colors.apricot }]}>
                <AppText variant="small" weight="extrabold" color={colors.onApricot}>
                  {countdown}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="small" weight="semibold" tone="heroMuted">
            {formatDateRange(trip.start_date, trip.end_date)}
          </AppText>
          {checklist && checklist.total > 0 && (
            <View style={styles.progress}>
              <View style={styles.progressLabels}>
                <AppText variant="small" weight="bold" tone="hero">
                  Preparação
                </AppText>
                <AppText variant="small" weight="bold" tone="hero">
                  {checklist.done} de {checklist.total} itens
                </AppText>
              </View>
              <ProgressBar value={checklist.done / checklist.total} tone="hero" />
            </View>
          )}
        </Surface>
      )}
    </Pressable>
  );
}

/** Linha compacta para viagens em planejamento ou já feitas. */
export function TripRow({ trip, onPress, past }: { trip: Trip; onPress: () => void; past?: boolean }) {
  const { colors } = useAppTheme();
  const tint = past ? colors.orange : colors.green;
  const icon: IconName = past ? 'sun' : 'mountain';
  const subtitle = [
    trip.destinations.join(' · '),
    past && trip.start_date ? formatMonthYear(trip.start_date) : formatDateRange(trip.start_date, trip.end_date).toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${trip.name}, ${subtitle}`}>
      {({ pressed }) => (
        <Surface style={[styles.row, pressed && styles.pressed]}>
          <View style={[styles.rowIcon, { backgroundColor: tint.bg }]}>
            <Icon name={icon} size={26} color={tint.fg} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" weight="extrabold" style={styles.rowTitle}>
              {trip.name}
            </AppText>
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
          <Icon name="chevronRight" size={20} color={colors.muted} />
        </Surface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  hero: { padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  progress: { gap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rowIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 17 },
});
