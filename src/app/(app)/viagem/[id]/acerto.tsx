import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorView, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useRates } from '@/data/exchange';
import { computeBalances, isSettled, suggestTransfers, useAddSettlement, useDeleteSettlement, useSettlements, type Transfer } from '@/data/settle';
import { useExpenses } from '@/data/trip-content';
import { useTrip, useTripMembers } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { firstName, formatDayMonth, formatMoney } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

/** Quem deve para quem, a partir dos gastos divididos igualmente, e os pagamentos já feitos. */
export default function SettleUpScreen() {
  const id = useTripId();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const expenses = useExpenses(id);
  const settlements = useSettlements(id);
  const rates = useRates(trip.data?.local_currency);
  const add = useAddSettlement(id);
  const remove = useDeleteSettlement(id);

  const currency = trip.data?.local_currency ?? 'EUR';
  const me = members.data?.find((m) => m.user_id === session?.user.id);
  const canEdit = me?.role === 'owner' || me?.role === 'editor';
  const nameOf = (userId: string) => {
    if (userId === session?.user.id) return 'Você';
    return firstName(members.data?.find((m) => m.user_id === userId)?.profiles?.name ?? '') || 'Viajante';
  };
  /** Nome no meio da frase: "para você". */
  const toName = (userId: string) => (userId === session?.user.id ? 'você' : nameOf(userId));

  const loading = members.isPending || expenses.isPending || settlements.isPending;
  const ready = members.data && expenses.data && settlements.data;
  const { balances, skipped } = ready
    ? computeBalances(
        members.data.map((m) => m.user_id),
        expenses.data,
        settlements.data,
        currency,
        rates.data,
      )
    : { balances: new Map<string, number>(), skipped: 0 };
  const transfers = suggestTransfers(balances);

  async function markPaid(t: Transfer) {
    const money = formatMoney(t.amount, currency, { cents: true });
    const ok = await confirmAction(
      'Marcar como pago?',
      `${nameOf(t.from)} pagou ${money} para ${toName(t.to)}.`,
      'Marcar como pago',
    );
    if (ok) add.mutate({ from_user: t.from, to_user: t.to, amount: t.amount, currency });
  }

  async function undo(settlementId: string) {
    if (await confirmAction('Desfazer pagamento?', 'O valor volta a aparecer como pendente.', 'Desfazer')) remove.mutate(settlementId);
  }

  return (
    <Screen header={<ScreenHeader title="Acerto de contas" />}>
      <AppText variant="small" tone="muted">
        Considera os gastos marcados como &quot;Dividir igualmente&quot;, rateados entre todos os viajantes, em {currency}.
      </AppText>

      {loading && <SkeletonBlock height={160} radius={22} />}
      {(members.isError || expenses.isError) && (
        <ErrorView message="Não conseguimos carregar os gastos." onRetry={() => expenses.refetch()} />
      )}
      {settlements.isError && (
        <ErrorView message="O acerto de contas ainda não está disponível no servidor. Tente de novo mais tarde." onRetry={() => settlements.refetch()} />
      )}

      {ready && members.data.length < 2 && (
        <EmptyState
          title="Só você nesta viagem"
          message="Convide quem vai viajar com você para dividir os gastos e ver quem deve para quem."
          action={<Button label="Convidar viajantes" size="medium" onPress={() => router.push({ pathname: '/viagem/[id]/viajantes', params: { id } })} />}
        />
      )}

      {ready && members.data.length >= 2 && (
        <>
          <View style={styles.section}>
            <SectionTitle>Saldos</SectionTitle>
            <Surface>
              {members.data.map((m, i) => {
                const value = balances.get(m.user_id) ?? 0;
                const settled = isSettled(value);
                const tint = settled ? colors.muted : value > 0 ? colors.green.fg : colors.orange.fg;
                return (
                  <View
                    key={m.user_id}
                    style={[styles.row, i < members.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                    <AppText variant="bodyStrong" style={styles.flex}>
                      {nameOf(m.user_id)}
                    </AppText>
                    <View style={styles.amount}>
                      <AppText variant="bodyStrong" weight="extrabold" color={tint}>
                        {settled ? 'Quite' : formatMoney(Math.abs(value), currency, { cents: true })}
                      </AppText>
                      {!settled && (
                        <AppText variant="caption" tone="muted">
                          {value > 0 ? 'a receber' : 'a pagar'}
                        </AppText>
                      )}
                    </View>
                  </View>
                );
              })}
            </Surface>
          </View>

          <View style={styles.section}>
            <SectionTitle>Como acertar</SectionTitle>
            {transfers.length === 0 ? (
              <Surface style={styles.done}>
                <View style={[styles.badge, { backgroundColor: colors.green.bg }]}>
                  <Icon name="check" size={22} color={colors.green.fg} strokeWidth={2.4} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex}>
                  Tudo certo! Ninguém deve nada.
                </AppText>
              </Surface>
            ) : (
              transfers.map((t) => (
                <Surface key={`${t.from}-${t.to}`} style={styles.transfer}>
                  <View style={styles.transferTop}>
                    <AppText variant="bodyStrong" style={styles.flex}>
                      {nameOf(t.from)} paga para {toName(t.to)}
                    </AppText>
                    <AppText variant="heading">{formatMoney(t.amount, currency, { cents: true })}</AppText>
                  </View>
                  {canEdit && (
                    <Button label="Marcar como pago" variant="secondary" size="medium" loading={add.isPending} onPress={() => markPaid(t)} />
                  )}
                </Surface>
              ))
            )}
            {add.isError && (
              <AppText variant="small" tone="danger">
                Não foi possível registrar o pagamento. Tente de novo.
              </AppText>
            )}
          </View>

          {skipped > 0 && (
            <AppText variant="caption" tone="muted">
              {skipped === 1 ? '1 lançamento ficou' : `${skipped} lançamentos ficaram`} de fora por estar em moeda sem cotação disponível.
            </AppText>
          )}

          {settlements.data.length > 0 && (
            <View style={styles.section}>
              <SectionTitle>Pagamentos feitos</SectionTitle>
              <Surface>
                {settlements.data.map((s, i) => (
                  <View
                    key={s.id}
                    style={[styles.row, i < settlements.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong">
                        {nameOf(s.from_user)} → {nameOf(s.to_user)}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {formatDayMonth(s.created_at.slice(0, 10))} · {formatMoney(Number(s.amount), s.currency, { cents: true })}
                      </AppText>
                    </View>
                    {canEdit && <Button label="Desfazer" variant="secondary" size="medium" onPress={() => undo(s.id)} />}
                  </View>
                ))}
              </Surface>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  amount: { alignItems: 'flex-end' },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  transfer: { padding: 16, gap: 12 },
  transferTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
