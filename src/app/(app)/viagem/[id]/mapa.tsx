import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { EmptyState, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useActivities, useReservations } from '@/data/trip-content';
import { useTrip } from '@/data/trips';
import { eachDay, formatTime, formatWeekdayDayMonth, toISODate } from '@/lib/format';
import { openPlace, openRoute } from '@/lib/maps';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

type Stop = { key: string; title: string; place: string; time: string };

export default function TripMapScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const activities = useActivities(id);
  const reservations = useReservations(id);
  const { colors } = useAppTheme();

  // Paradas por dia: atividades e reservas que têm local, em ordem de horário.
  const stopsByDay = useMemo(() => {
    const map = new Map<string, Stop[]>();
    const add = (day: string, stop: Stop) => map.set(day, [...(map.get(day) ?? []), stop]);
    for (const a of activities.data ?? []) {
      if (a.place) add(a.day, { key: `a-${a.id}`, title: a.title, place: a.place, time: formatTime(a.start_time) });
    }
    for (const r of reservations.data ?? []) {
      if (r.place && r.starts_at) add(r.starts_at.slice(0, 10), { key: `r-${r.id}`, title: r.title, place: r.place, time: r.starts_at.slice(11, 16) });
    }
    for (const list of map.values()) list.sort((x, y) => (x.time || '99').localeCompare(y.time || '99'));
    return map;
  }, [activities.data, reservations.data]);

  const days = useMemo(() => {
    const t = trip.data;
    const fromTrip = t?.start_date && t.end_date ? eachDay(t.start_date, t.end_date) : [];
    return [...new Set([...fromTrip, ...stopsByDay.keys()])].sort();
  }, [trip.data, stopsByDay]);

  const [picked, setPicked] = useState<string | null>(null);
  const today = toISODate(new Date());
  const day = picked && days.includes(picked) ? picked : days.find((d) => d >= today && stopsByDay.has(d)) ?? days.find((d) => stopsByDay.has(d)) ?? days[0];
  const stops = day ? stopsByDay.get(day) ?? [] : [];
  const dayOptions = days.map((d, i) => ({ value: d, label: `Dia ${i + 1} · ${formatWeekdayDayMonth(d)}` }));

  return (
    <Screen
      header={<ScreenHeader title="Mapa da viagem" />}
      footer={stops.length > 1 ? <Button label="Ver rota do dia" icon="map" onPress={() => openRoute(stops.map((s) => s.place))} /> : undefined}>
      {days.length > 0 && day && <ChipGroup options={dayOptions} value={day} onChange={setPicked} scroll />}
      {stops.length === 0 ? (
        <EmptyState
          title="Nenhum lugar neste dia"
          message="Preencha o campo Local nas atividades e reservas para vê-las aqui e abrir no app de mapas."
        />
      ) : (
        <Surface>
          {stops.map((stop, index) => (
            <Pressable
              key={stop.key}
              onPress={() => openPlace(stop.place)}
              accessibilityRole="link"
              accessibilityLabel={`${stop.title}, ${stop.place}. Abrir no mapa`}
              style={[styles.row, index < stops.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
              <View style={[styles.pin, { backgroundColor: colors.accent }]}>
                <AppText variant="small" weight="extrabold" color={colors.onAccent}>
                  {index + 1}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {stop.title}
                </AppText>
                <AppText variant="small" tone="muted" numberOfLines={1}>
                  {[stop.time, stop.place].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              <Icon name="map" size={20} color={colors.accent} />
            </Pressable>
          ))}
        </Surface>
      )}
      <AppText variant="caption" tone="muted" style={styles.center}>
        Toque num lugar para abrir no app de mapas do celular.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 16, paddingVertical: 10 },
  pin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
