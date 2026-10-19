import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { useTabBarSpace } from '@/components/trip-tab-bar';
import { FloatingButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorView, ProgressBar, Screen, SectionTitle, TabTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { summarizeBudget } from '@/data/budget';
import { convert, useHomeCurrency, useRates } from '@/data/exchange';
import { computeBalances, isSettled, useSettlements } from '@/data/settle';
import { useExpenses } from '@/data/trip-content';
import { useTrip, useTripMembers } from '@/data/trips';
import { firstName, formatDayMonth, formatMoney } from '@/lib/format';
import { ExpenseCategoryLabels } from '@/lib/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';

export default function ExpensesScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const expenses = useExpenses(id);
  const settlements = useSettlements(id);
  const rates = useRates(trip.data?.local_currency);
  const home = useHomeCurrency();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const space = useTabBarSpace(true);

  const t = trip.data;
  const travelers = members.data?.length ?? 1;
  const summary = t && expenses.data ? summarizeBudget(t, expenses.data, travelers, rates.data) : null;
  const spentAtHome = summary && t && home !== t.local_currency ? convert(summary.spent, t.local_currency, home, rates.data) : null;
  const homeRate = t && home !== t.local_currency ? convert(1, t.local_currency, home, rates.data) : null;
  const myBalance =
    t && travelers > 1 && expenses.data && members.data
      ? computeBalances(
          members.data.map((m) => m.user_id),
          expenses.data,
          settlements.data ?? [],
          t.local_currency,
          rates.data,
        ).balances.get(session?.user.id ?? '') ?? 0
      : null;
  const maxCategory = summary?.categories[0]?.[1] ?? 0;
  const nameOf = (userId: string) => firstName(members.data?.find((m) => m.user_id === userId)?.profiles?.name ?? '') || 'Alguém';

  return (
    <View style={styles.flex}>
      <Screen bottomSpace={space.content} header={<TabTitle overline={t?.name} title="Gastos" />}>
        {(expenses.isPending || !t) && <SkeletonBlock height={190} radius={26} />}
        {expenses.isError && <ErrorView message="Não conseguimos carregar os gastos." onRetry={() => expenses.refetch()} />}

        {summary && t && (
          <Surface variant="hero" radius={26} style={styles.hero}>
            <AppText variant="small" weight="bold" tone="heroMuted">
              Gasto até agora
            </AppText>
            <View style={styles.amountRow}>
              <AppText variant="display" tone="hero" style={styles.amount}>
                {formatMoney(summary.spent, t.local_currency)}
              </AppText>
              {summary.budget != null && (
                <AppText weight="semibold" tone="heroMuted">
                  de {formatMoney(summary.budget, t.local_currency)}
                </AppText>
              )}
            </View>
            {spentAtHome != null && (
              <AppText variant="small" weight="semibold" tone="heroMuted">
                ≈ {formatMoney(spentAtHome, home, { cents: false })}
              </AppText>
            )}
            {summary.budget != null && <ProgressBar value={summary.progress} tone="hero" />}
            <View style={styles.statRow}>
              <View style={[styles.stat, { backgroundColor: colors.heroTrack }]}>
                <AppText variant="caption" weight="semibold" tone="heroMuted">
                  Disponível
                </AppText>
                <AppText variant="heading" tone="hero">
                  {summary.remaining != null ? formatMoney(summary.remaining, t.local_currency) : '—'}
                </AppText>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.heroTrack }]}>
                <AppText variant="caption" weight="semibold" tone="heroMuted">
                  Por pessoa
                </AppText>
                <AppText variant="heading" tone="hero">
                  {formatMoney(summary.perPerson, t.local_currency)}
                </AppText>
              </View>
            </View>
            {summary.otherCurrencies > 0 && (
              <AppText variant="caption" tone="heroMuted">
                {summary.otherCurrencies === 1
                  ? '1 gasto em moeda sem cotação disponível ficou fora do total.'
                  : `${summary.otherCurrencies} gastos em moeda sem cotação disponível ficaram fora do total.`}
              </AppText>
            )}
          </Surface>
        )}

        {t && (homeRate != null || summary?.converted) ? (
          <Pressable
            onPress={() => router.push({ pathname: '/viagem/[id]/cambio', params: { id } })}
            accessibilityRole="button"
            accessibilityLabel="Abrir o conversor de moedas">
            <Surface style={styles.rateRow}>
              <Icon name="wallet" size={22} color={colors.accent} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">
                  {homeRate != null ? `1 ${t.local_currency} = ${formatMoney(homeRate, home, { cents: true })}` : 'Câmbio do dia'}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {summary?.converted ? 'Gastos em outras moedas entram convertidos · ' : ''}Abrir conversor
                </AppText>
              </View>
              <Icon name="chevronRight" size={18} color={colors.muted} />
            </Surface>
          </Pressable>
        ) : null}

        {t && myBalance != null && (
          <Pressable
            onPress={() => router.push({ pathname: '/viagem/[id]/acerto', params: { id } })}
            accessibilityRole="button"
            accessibilityLabel="Abrir acerto de contas">
            <Surface style={styles.rateRow}>
              <Icon name="users" size={22} color={colors.accent} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Acerto de contas</AppText>
                <AppText variant="caption" tone="muted">
                  {isSettled(myBalance)
                    ? 'Você está quite com todos'
                    : myBalance > 0
                      ? `Você tem ${formatMoney(myBalance, t.local_currency, { cents: true })} a receber`
                      : `Você deve ${formatMoney(-myBalance, t.local_currency, { cents: true })}`}
                </AppText>
              </View>
              <Icon name="chevronRight" size={18} color={colors.muted} />
            </Surface>
          </Pressable>
        )}

        {summary && t && summary.categories.length > 0 && (
          <Surface style={styles.categories}>
            <AppText variant="bodyStrong" weight="extrabold">
              Por categoria
            </AppText>
            {summary.categories.map(([category, value]) => (
              <View key={category} style={styles.category}>
                <View style={styles.categoryTop}>
                  <AppText variant="small" weight="bold">
                    {ExpenseCategoryLabels[category]}
                  </AppText>
                  <AppText variant="small" weight="extrabold">
                    {formatMoney(value, t.local_currency)}
                  </AppText>
                </View>
                <ProgressBar value={maxCategory ? value / maxCategory : 0} />
              </View>
            ))}
          </Surface>
        )}

        {expenses.data && expenses.data.length === 0 && (
          <EmptyState title="Nenhum gasto ainda" message="Registre o que for pagando. O Tripi soma por categoria e divide entre os viajantes." />
        )}

        {expenses.data && expenses.data.length > 0 && (
          <View style={styles.section}>
            <SectionTitle>Recentes</SectionTitle>
            <Surface>
              {expenses.data.map((e, i) => (
                <Pressable
                  key={e.id}
                  onPress={() => router.push({ pathname: '/viagem/[id]/gasto-novo', params: { id, editId: e.id } })}
                  style={({ pressed }) => [
                    styles.row,
                    i < expenses.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.description}, ${formatMoney(Number(e.amount), e.currency)}`}
                  accessibilityHint="Toque para editar ou excluir">
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{e.description}</AppText>
                    <AppText variant="small" tone="muted">
                      {ExpenseCategoryLabels[e.category]} · {formatDayMonth(e.spent_on)} · pago por {nameOf(e.paid_by)}
                      {e.split_equally && travelers > 1 ? ` · dividido ${travelers}×` : ''}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong" weight="extrabold">
                    {formatMoney(Number(e.amount), e.currency)}
                  </AppText>
                </Pressable>
              ))}
            </Surface>
          </View>
        )}
      </Screen>
      <FloatingButton label="Gasto" bottom={space.fab} onPress={() => router.push({ pathname: '/viagem/[id]/gasto-novo', params: { id } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { padding: 20, gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  amount: { fontSize: 36, lineHeight: 42 },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, gap: 2 },
  categories: { padding: 16, gap: 12 },
  category: { gap: 6 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { gap: 8 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pressed: { opacity: 0.7 },
});
