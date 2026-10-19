import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTabBarSpace } from '@/components/trip-tab-bar';
import { FloatingButton } from '@/components/ui/button';
import { Tag } from '@/components/ui/chip';
import { EmptyState, ErrorView, Screen, TabTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { SkeletonBlock } from '@/components/skeleton';
import { useActivities } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { eachDay, formatDayMonth, formatTime, formatWeekdayDayMonth, parseISODate, toISODate, weekdayShort } from '@/lib/format';
import { ActivityCategoryLabels, activityTint } from '@/lib/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { useTripId } from '@/providers/trip-id';

export default function ItineraryScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const activities = useActivities(id);
  const { colors, scheme } = useAppTheme();
  const space = useTabBarSpace(true);

  // Dias da viagem; sem datas, usa os dias que já têm atividades.
  const days = useMemo(() => {
    const t = trip.data;
    if (t?.start_date && t.end_date) return eachDay(t.start_date, t.end_date);
    const used = [...new Set((activities.data ?? []).map((a) => a.day))].sort();
    return used.length > 0 ? used : [toISODate(new Date())];
  }, [trip.data, activities.data]);

  const today = toISODate(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const day = selected && days.includes(selected) ? selected : days.includes(today) ? today : days[0];
  const dayIndex = days.indexOf(day) + 1;
  const items = (activities.data ?? []).filter((a) => a.day === day);

  return (
    <View style={styles.flex}>
      <Screen
        bottomSpace={space.content}
        header={
          <View>
            <TabTitle overline={trip.data?.name} title="Roteiro" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} accessibilityRole="tablist">
              {days.map((d, i) => {
                const on = d === day;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setSelected(d)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Dia ${i + 1}, ${formatWeekdayDayMonth(d)}`}
                    style={[
                      styles.day,
                      on
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : { backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : colors.surface, borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.15)' : colors.surfaceBorder },
                    ]}>
                    <AppText variant="caption" weight="bold" color={on ? colors.onAccent : colors.text} style={styles.dayLabel}>
                      Dia {i + 1}
                    </AppText>
                    <AppText variant="heading" color={on ? colors.onAccent : colors.text}>
                      {parseISODate(d).getDate()}
                    </AppText>
                    <AppText variant="caption" weight="semibold" color={on ? colors.onAccent : colors.text}>
                      {weekdayShort(d)}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }>
        <View style={styles.dayHeader}>
          <AppText variant="heading">
            Dia {dayIndex} · {formatWeekdayDayMonth(day)}
          </AppText>
          {items.length > 0 && (
            <AppText variant="small" weight="bold" tone="muted">
              {items.length} {items.length === 1 ? 'atividade' : 'atividades'}
            </AppText>
          )}
        </View>

        {activities.isPending && (
          <>
            <SkeletonBlock height={92} radius={16} />
            <SkeletonBlock height={92} radius={16} />
          </>
        )}
        {activities.isError && <ErrorView message="Não conseguimos carregar o roteiro." onRetry={() => activities.refetch()} />}
        {activities.data && items.length === 0 && (
          <EmptyState title="Nada planejado ainda" message={`Adicione passeios, refeições e deslocamentos de ${formatDayMonth(day)}.`} />
        )}
        {items.map((item) => {
          const tint = activityTint(colors, item.category);
          return (
            <View key={item.id} style={styles.item}>
              {item.start_time ? (
                <AppText variant="bodyStrong" weight="extrabold" style={styles.time}>
                  {formatTime(item.start_time)}
                </AppText>
              ) : (
                <AppText variant="caption" weight="bold" tone="muted" numberOfLines={1} style={[styles.time, styles.noTime]}>
                  sem hora
                </AppText>
              )}
              <Pressable
                style={styles.flex}
                onPress={() => router.push({ pathname: '/viagem/[id]/atividade-nova', params: { id, editId: item.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}${item.place ? `, ${item.place}` : ''}`}
                accessibilityHint="Toque para editar ou excluir">
                {({ pressed }) => (
                  <Surface radius={18} style={[styles.card, pressed && styles.pressed]}>
                    <AppText variant="bodyStrong" weight="extrabold">
                      {item.title}
                    </AppText>
                    {item.place && (
                      <AppText variant="small" tone="muted">
                        {item.place}
                      </AppText>
                    )}
                    <Tag label={ActivityCategoryLabels[item.category]} bg={tint.bg} fg={tint.fg} />
                  </Surface>
                )}
              </Pressable>
            </View>
          );
        })}
      </Screen>
      <FloatingButton
        label="Atividade"
        bottom={space.fab}
        onPress={() => router.push({ pathname: '/viagem/[id]/atividade-nova', params: { id, day } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  days: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  day: { width: 64, minHeight: 74, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dayLabel: { textTransform: 'uppercase', fontSize: 10.5, letterSpacing: 0.6 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  item: { flexDirection: 'row', gap: 12 },
  time: { width: 56, paddingTop: 14 },
  noTime: { paddingTop: 17, fontSize: 11 },
  card: { flex: 1, padding: 14, gap: 6 },
  pressed: { opacity: 0.85 },
});
