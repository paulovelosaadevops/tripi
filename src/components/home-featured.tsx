import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/agenda-list';
import { Icon } from '@/components/ui/icon';
import { ProgressBar, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { buildDayAgenda } from '@/data/agenda';
import { summarizeBudget } from '@/data/budget';
import { convert, useHomeCurrency, useRateOn, useRates } from '@/data/exchange';
import { preparation } from '@/data/preparation';
import { useReminderSettings } from '@/data/reminders';
import { useActivities, useChecklist, useExpenses, useReservations } from '@/data/trip-content';
import { useDocuments } from '@/data/trip-extras';
import { useTripMembers } from '@/data/trips';
import { describeWeather, useTripClimate, useTripWeather } from '@/data/weather';
import { daysUntil, eachDay, formatDateRange, formatMoney, initials, parseISODate, toISODate } from '@/lib/format';
import { shareTripInvite } from '@/lib/share';
import type { Trip } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

const MAX_STEPS = 3;

function shiftDays(iso: string, delta: number) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

/**
 * Tela inicial: a viagem em destaque (a próxima ou a que está acontecendo) com o que importa agora —
 * preparação, pendências, câmbio, clima e atalhos. Cada parte só aparece quando tem algo útil.
 */
export function FeaturedTrip({ trip }: { trip: Trip }) {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const home = useHomeCurrency();
  const members = useTripMembers(trip.id);
  const checklist = useChecklist(trip.id);
  const reservations = useReservations(trip.id);
  const activities = useActivities(trip.id);
  const documents = useDocuments(trip.id);
  const expenses = useExpenses(trip.id);
  const reminders = useReminderSettings(trip.id);
  const rates = useRates(trip.local_currency);
  const weekAgo = shiftDays(toISODate(new Date()), -7);
  const lastWeek = useRateOn(trip.local_currency, home, weekAgo);
  const weather = useTripWeather(trip.destinations);
  const climate = useTripClimate(weather.place, trip.start_date, trip.end_date, weather.forecast);
  const [allSteps, setAllSteps] = useState(false);

  const today = toISODate(new Date());
  const days = trip.start_date && trip.end_date ? eachDay(trip.start_date, trip.end_date) : [];
  const dayIndex = days.indexOf(today);
  const inTrip = dayIndex >= 0;
  const go = (screen: string) => router.push(`/viagem/${trip.id}/${screen}` as Href);
  const openTrip = () => router.push({ pathname: '/viagem/[id]', params: { id: trip.id } });

  const loaded = checklist.data && reservations.data && documents.data;
  const prep = loaded
    ? preparation(trip, {
        checklist: checklist.data,
        reservations: reservations.data,
        documents: documents.data,
        remindersOn: reminders.data?.enabled ?? false,
        userId: session?.user.id,
      })
    : null;
  const steps = prep?.steps ?? [];
  const visibleSteps = allSteps ? steps : steps.slice(0, MAX_STEPS);

  // Hoje (durante a viagem): o próximo compromisso do dia.
  const now = new Date().toTimeString().slice(0, 5);
  const agenda = inTrip ? buildDayAgenda(today, activities.data ?? [], reservations.data ?? []) : [];
  const nextUp = agenda.find((item) => !item.time || item.time >= now);
  const todayWeather = weather.forecast[today];

  // Dinheiro.
  const rate = home !== trip.local_currency ? convert(1, trip.local_currency, home, rates.data) : null;
  const change = rate != null && lastWeek.data ? ((rate - lastWeek.data) / lastWeek.data) * 100 : null;
  const budget = expenses.data ? summarizeBudget(trip, expenses.data, members.data?.length ?? 1, rates.data) : null;
  const spentHome = budget && rate != null ? convert(budget.spent, trip.local_currency, home, rates.data) : null;

  const countdown = !trip.start_date ? null : inTrip ? `Dia ${dayIndex + 1} de ${days.length}` : daysUntil(trip.start_date) > 1 ? `${daysUntil(trip.start_date)} dias` : daysUntil(trip.start_date) === 1 ? 'Amanhã' : 'Hoje';

  return (
    <>
      <View style={styles.section}>
        <SectionTitle>{inTrip ? 'Em viagem' : 'Próxima viagem'}</SectionTitle>
        <Pressable onPress={openTrip} accessibilityRole="button" accessibilityLabel={`${trip.name}, ${formatDateRange(trip.start_date, trip.end_date)}${countdown ? ', ' + countdown : ''}`}>
          {({ pressed }) => (
            <Surface variant="hero" radius={26} style={[styles.hero, pressed && styles.pressed]}>
              <View style={styles.heroTop}>
                <View style={styles.flex}>
                  <AppText variant="title" tone="hero">
                    {trip.name}
                  </AppText>
                  {trip.destinations.length > 0 && (
                    <AppText weight="semibold" tone="heroMuted" numberOfLines={1}>
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
              <View style={styles.heroMid}>
                <AppText variant="small" weight="semibold" tone="heroMuted" style={styles.flex}>
                  {formatDateRange(trip.start_date, trip.end_date)}
                </AppText>
                {members.data && members.data.length > 1 && (
                  <View style={styles.avatars} accessibilityLabel={`${members.data.length} viajantes`}>
                    {members.data.slice(0, 3).map((m, i) => (
                      <View key={m.user_id} style={[styles.avatar, { backgroundColor: colors.heroTrack, borderColor: colors.hero, marginLeft: i ? -8 : 0 }]}>
                        <AppText variant="caption" weight="extrabold" tone="hero">
                          {initials(m.profiles?.name ?? '')}
                        </AppText>
                      </View>
                    ))}
                    {members.data.length > 3 && (
                      <AppText variant="caption" weight="bold" tone="heroMuted" style={styles.more}>
                        +{members.data.length - 3}
                      </AppText>
                    )}
                  </View>
                )}
              </View>
              {prep && prep.total > 0 && !inTrip && (
                <View style={styles.progress}>
                  <View style={styles.progressLabels}>
                    <AppText variant="small" weight="bold" tone="hero">
                      Preparação
                    </AppText>
                    <AppText variant="small" weight="bold" tone="hero">
                      {Math.round(prep.progress * 100)}%
                    </AppText>
                  </View>
                  <ProgressBar value={prep.progress} tone="hero" />
                </View>
              )}
            </Surface>
          )}
        </Pressable>
      </View>

      {inTrip && (
        <Pressable onPress={openTrip} accessibilityRole="button" accessibilityLabel="Abrir o dia de hoje">
          {({ pressed }) => (
            <Surface style={[styles.row, pressed && styles.pressed]}>
              <View style={[styles.badge, { backgroundColor: colors.orange.bg }]}>
                <Icon name="calendar" size={22} color={colors.orange.fg} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {nextUp ? `${nextUp.time ? nextUp.time + ' · ' : ''}${nextUp.title}` : 'Nada mais marcado para hoje'}
                </AppText>
                <AppText variant="small" tone="muted" numberOfLines={1}>
                  {[
                    nextUp ? 'Próximo de hoje' : 'Aproveite o dia livre',
                    todayWeather ? `${describeWeather(todayWeather.code).emoji} ${todayWeather.max}° / ${todayWeather.min}°` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              <Icon name="chevronRight" size={18} color={colors.muted} />
            </Surface>
          )}
        </Pressable>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick} style={styles.quickRow}>
        <PillButton icon="bolt" label="Gasto" onPress={() => go('gasto-rapido')} accessibilityLabel="Lançar gasto rápido" />
        <PillButton icon="wallet2" label="Carteira" onPress={() => go('carteira')} accessibilityLabel="Abrir carteira de viagem" />
        <PillButton icon="checklist" label="Checklist" onPress={() => go('checklist')} accessibilityLabel="Abrir checklist" />
        {/* Convidar só enquanto a viagem é solo: depois vira ruído. */}
        {(members.data?.length ?? 1) <= 1 && (
          <PillButton icon="users" label="Convidar" onPress={() => shareTripInvite(trip)} accessibilityLabel="Convidar para a viagem" />
        )}
      </ScrollView>

      {steps.length > 0 && !inTrip && (
        <View style={styles.section}>
          <SectionTitle>Próximos passos</SectionTitle>
          <Surface>
            {visibleSteps.map((step, i) => (
              <Pressable
                key={step.key}
                onPress={() => go(step.screen)}
                accessibilityRole="button"
                accessibilityLabel={step.text}
                style={({ pressed }) => [
                  styles.step,
                  i < visibleSteps.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator },
                  pressed && styles.pressed,
                ]}>
                <Icon name={step.icon} size={20} color={step.urgent ? colors.orange.fg : colors.accent} />
                <AppText variant="small" weight="semibold" style={styles.flex}>
                  {step.text}
                </AppText>
                <Icon name="chevronRight" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </Surface>
          {steps.length > MAX_STEPS && (
            <Pressable onPress={() => setAllSteps(!allSteps)} accessibilityRole="button" hitSlop={8}>
              <AppText variant="small" weight="bold" tone="accent">
                {allSteps ? 'Mostrar menos' : `Ver mais ${steps.length - MAX_STEPS}`}
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      {(rate != null || (budget && budget.spent > 0) || climate) && (
        <View style={styles.cards}>
          {(rate != null || (budget && budget.spent > 0)) && (
            <Pressable onPress={() => go('cambio')} accessibilityRole="button" style={styles.card}>
              {({ pressed }) => (
                <Surface style={[styles.mini, pressed && styles.pressed]}>
                  <AppText variant="caption" weight="bold" tone="muted">
                    DINHEIRO
                  </AppText>
                  {rate != null && (
                    <AppText variant="bodyStrong" weight="extrabold">
                      1 {trip.local_currency} = {formatMoney(rate, home, { cents: true })}
                    </AppText>
                  )}
                  {change != null && Math.abs(change) >= 0.05 && (
                    <AppText variant="caption" weight="bold" color={change > 0 ? colors.orange.fg : colors.green.fg}>
                      {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1).replace('.', ',')}% na semana
                    </AppText>
                  )}
                  {budget && budget.spent > 0 && (
                    <AppText variant="caption" tone="muted">
                      Gasto {formatMoney(budget.spent, trip.local_currency)}
                      {spentHome != null ? ` ≈ ${formatMoney(spentHome, home, { cents: false })}` : ''}
                      {budget.budget != null ? ` de ${formatMoney(budget.budget, trip.local_currency)}` : ''}
                    </AppText>
                  )}
                </Surface>
              )}
            </Pressable>
          )}
          {climate && (
            <Surface style={[styles.mini, styles.card]} accessibilityRole="summary">
              <AppText variant="caption" weight="bold" tone="muted">
                {climate.source === 'previsao' ? 'PREVISÃO' : 'CLIMA ESPERADO'}
              </AppText>
              <AppText variant="bodyStrong" weight="extrabold">
                {climate.rainyDays > climate.days / 3 ? '🌦️' : '☀️'} {climate.max}° / {climate.min}°
              </AppText>
              <AppText variant="caption" tone="muted">
                {climate.rainyDays === 0 ? 'Sem chuva' : `Chuva em ${climate.rainyDays} de ${climate.days} dias`}
                {climate.source === 'ano-passado' ? ' · nessas datas no ano passado' : ''}
              </AppText>
            </Surface>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  section: { gap: 8 },
  hero: { padding: 20, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroMid: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  more: { marginLeft: 6 },
  progress: { gap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickRow: { marginHorizontal: -20 },
  quick: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 52, paddingVertical: 10 },
  cards: { flexDirection: 'row', gap: 10 },
  card: { flex: 1 },
  mini: { padding: 14, gap: 4, flex: 1 },
});
