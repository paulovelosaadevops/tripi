import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { formatDateRange, formatMonthYear } from '@/lib/format';
import type { Trip } from '@/lib/types';
import { useAppTheme } from '@/theme/theme-provider';

/** Linha compacta para viagens em planejamento ou já feitas. */
export function TripRow({ trip, onPress, past, extra }: { trip: Trip; onPress: () => void; past?: boolean; extra?: string | null }) {
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${trip.name}, ${subtitle}${extra ? ', ' + extra : ''}`}>
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
            {extra ? (
              <AppText variant="small" weight="bold" tone="muted">
                {extra}
              </AppText>
            ) : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rowIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 17 },
});
