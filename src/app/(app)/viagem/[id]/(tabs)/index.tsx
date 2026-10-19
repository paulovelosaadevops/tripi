import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/trip-tab-bar';
import { IconButton } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { ErrorView, LoadingView, ProgressBar, Screen, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { summarizeBudget } from '@/data/budget';
import { convert, useHomeCurrency, useRates } from '@/data/exchange';
import { useActivities, useChecklist, useExpenses, useReservations } from '@/data/trip-content';
import { useTrip, useTripMembers } from '@/data/trips';
import { daysUntil, eachDay, formatDateRange, formatMoney, formatTime, formatWeekdayDayMonth, toISODate } from '@/lib/format';
import { ReservationKindLabels } from '@/lib/labels';
import { shareTripInvite } from '@/lib/share';
import { useAppTheme } from '@/theme/theme-provider';
import { useTripId } from '@/providers/trip-id';

export default function TripOverviewScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const activities = useActivities(id);
  const reservations = useReservations(id);
  const expenses = useExpenses(id);
  const checklist = useChecklist(id);
  const rates = useRates(trip.data?.local_currency);
  const home = useHomeCurrency();
  const { colors, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const space = useTabBarSpace();

  if (trip.isPending) return <LoadingView />;
  if (trip.isError || !trip.data) {
    return (
      <Screen>
        <ErrorView message="Não conseguimos abrir esta viagem." onRetry={() => trip.refetch()} />
      </Screen>
    );
  }

  const t = trip.data;
  const travelers = members.data?.length ?? 1;
  const budget = summarizeBudget(t, expenses.data ?? [], travelers, rates.data);
  const spentAtHome = home !== t.local_currency ? convert(budget.spent, t.local_currency, home, rates.data) : null;
  const daysToGo = t.start_date ? daysUntil(t.start_date) : null;
  const tripDays = t.start_date && t.end_date ? eachDay(t.start_date, t.end_date).length : null;
  const doneItems = checklist.data?.filter((i) => i.done).length ?? 0;

  // Próximo compromisso: a próxima reserva ou atividade a partir de hoje.
  const today = toISODate(new Date());
  const nextReservation = reservations.data?.find((r) => r.starts_at && r.starts_at.slice(0, 10) >= today);
  const nextActivity = activities.data?.find((a) => a.day >= today);
  const next =
    nextReservation && (!nextActivity || nextReservation.starts_at!.slice(0, 10) <= nextActivity.day)
      ? {
          title: nextReservation.title,
          sub: [
            ReservationKindLabels[nextReservation.kind],
            formatWeekdayDayMonth(nextReservation.starts_at!.slice(0, 10)),
            nextReservation.starts_at!.slice(11, 16) !== '00:00' ? nextReservation.starts_at!.slice(11, 16) : '',
          ]
            .filter(Boolean)
            .join(' · '),
          icon: 'plane' as IconName,
          onPress: () => router.navigate({ pathname: '/viagem/[id]/reservas', params: { id } }),
        }
      : nextActivity
        ? {
            title: nextActivity.title,
            sub: [formatWeekdayDayMonth(nextActivity.day), formatTime(nextActivity.start_time)].filter(Boolean).join(' · '),
            icon: 'calendar' as IconName,
            onPress: () => router.navigate({ pathname: '/viagem/[id]/roteiro', params: { id } }),
          }
        : null;

  const dark = scheme === 'dark';
  const stat = (value: string, label: string, highlight?: boolean) => (
    <View style={[styles.stat, { backgroundColor: dark ? (highlight ? colors.orange.bg : 'transparent') : colors.heroTrack }]}>
      <AppText variant="title" color={highlight ? colors.apricot : colors.heroText} style={styles.statValue}>
        {value}
      </AppText>
      <AppText variant="caption" weight="semibold" tone="heroMuted">
        {label}
      </AppText>
    </View>
  );

  return (
    <Screen bottomSpace={space.content}>
      <View
        style={[
          styles.hero,
          !dark && { backgroundColor: colors.hero, marginTop: -insets.top - 8, paddingTop: insets.top + 16 },
        ]}>
        <View style={styles.heroBar}>
          <Pressable onPress={() => router.navigate('/')} accessibilityRole="link" style={styles.backLink} hitSlop={8}>
            <Icon name="back" size={20} color={dark ? colors.text : colors.heroMuted} strokeWidth={2} />
            <AppText variant="small" weight="bold" color={dark ? colors.text : colors.heroMuted}>
              Minhas viagens
            </AppText>
          </Pressable>
          <View style={styles.heroActions}>
            <IconButton
              icon="search"
              label="Buscar na viagem"
              variant={dark ? 'surface' : 'hero'}
              onPress={() => router.push({ pathname: '/viagem/[id]/busca', params: { id } })}
            />
            <IconButton icon="share" label="Convidar para a viagem" variant={dark ? 'surface' : 'hero'} onPress={() => shareTripInvite(t)} />
          </View>
        </View>
        <View>
          <AppText variant="display" tone={dark ? 'default' : 'hero'} accessibilityRole="header">
            {t.name}
          </AppText>
          <AppText weight="semibold" tone={dark ? 'muted' : 'heroMuted'}>
            {[t.destinations.join(' · '), formatDateRange(t.start_date, t.end_date)].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <Surface variant="hero" radius={22} style={[styles.stats, !dark && styles.statsLight]}>
          {daysToGo != null && daysToGo > 0
            ? stat(String(daysToGo), daysToGo === 1 ? 'dia para ir' : 'dias para ir', true)
            : stat(daysToGo == null ? '—' : 'Hoje', daysToGo == null ? 'sem datas' : 'em viagem', true)}
          {stat(tripDays ? String(tripDays) : '—', 'dias de viagem')}
          {stat(String(travelers), travelers === 1 ? 'viajante' : 'viajantes')}
        </Surface>
      </View>

      {next && (
        <View style={styles.section}>
          <SectionTitle>Próximo compromisso</SectionTitle>
          <Pressable onPress={next.onPress} accessibilityRole="button" accessibilityLabel={`${next.title}, ${next.sub}`}>
            <Surface style={styles.next}>
              <View style={[styles.nextIcon, { backgroundColor: colors.orange.bg }]}>
                <Icon name={next.icon} size={24} color={colors.orange.fg} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {next.title}
                </AppText>
                <AppText variant="small" tone="muted">
                  {next.sub}
                </AppText>
              </View>
            </Surface>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={() => router.navigate({ pathname: '/viagem/[id]/gastos', params: { id } })}
        accessibilityRole="button"
        accessibilityLabel="Ver gastos">
        <Surface style={styles.budget}>
          <View style={styles.budgetTop}>
            <AppText variant="bodyStrong" weight="extrabold">
              Orçamento
            </AppText>
            <AppText variant="small" weight="bold" tone="accent">
              Ver gastos
            </AppText>
          </View>
          <View style={styles.amountRow}>
            <AppText variant="title">{expenses.data ? formatMoney(budget.spent, t.local_currency) : '…'}</AppText>
            {budget.budget != null && (
              <AppText variant="small" tone="muted">
                de {formatMoney(budget.budget, t.local_currency)}
              </AppText>
            )}
            {spentAtHome != null && budget.spent > 0 && (
              <AppText variant="small" tone="muted">
                · ≈ {formatMoney(spentAtHome, home, { cents: false })}
              </AppText>
            )}
          </View>
          {budget.budget != null && <ProgressBar value={budget.progress} />}
          <AppText variant="small" tone="muted">
            {budget.remaining != null
              ? `${formatMoney(budget.remaining, t.local_currency)} disponíveis · ${formatMoney(budget.perPerson, t.local_currency)} por pessoa`
              : 'Defina um orçamento para acompanhar o quanto ainda pode gastar.'}
          </AppText>
        </Surface>
      </Pressable>

      <View style={styles.grid}>
        <Tile icon="calendar" title="Roteiro" sub={activities.data ? plural(activities.data.length, 'atividade', 'atividades') : LOADING} onPress={() => router.navigate({ pathname: '/viagem/[id]/roteiro', params: { id } })} />
        <Tile icon="ticket" title="Reservas" sub={reservations.data ? plural(reservations.data.length, 'reserva', 'reservas') : LOADING} onPress={() => router.navigate({ pathname: '/viagem/[id]/reservas', params: { id } })} />
        <Tile icon="checklist" title="Checklist" sub={checklist.data ? `${doneItems} de ${checklist.data.length} itens` : LOADING} onPress={() => router.push({ pathname: '/viagem/[id]/checklist', params: { id } })} />
        <Tile icon="wallet" title="Gastos" sub={expenses.data ? plural(expenses.data.length, 'lançamento', 'lançamentos') : LOADING} onPress={() => router.navigate({ pathname: '/viagem/[id]/gastos', params: { id } })} />
      </View>
    </Screen>
  );
}

const LOADING = 'carregando…';

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Tile({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}, ${sub}`} style={styles.tileWrap}>
      {({ pressed }) => (
        <Surface style={[styles.tile, pressed && { opacity: 0.85 }]}>
          <Icon name={icon} size={24} color={colors.accent} />
          <AppText variant="bodyStrong" weight="extrabold">
            {title}
          </AppText>
          <AppText variant="small" tone="muted">
            {sub}
          </AppText>
        </Surface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    gap: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroActions: { flexDirection: 'row', gap: 8 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  stats: { flexDirection: 'row', gap: 8, padding: 8 },
  statsLight: { padding: 0, backgroundColor: 'transparent' },
  stat: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, gap: 2 },
  statValue: { fontSize: 22, lineHeight: 28 },
  section: { gap: 10 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  nextIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  budget: { padding: 16, gap: 10 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileWrap: { width: '48%', flexGrow: 1 },
  tile: { padding: 16, gap: 8 },
});
