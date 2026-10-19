import { useMutation, useQuery } from '@tanstack/react-query';

import { convert, type Rates } from '@/data/exchange';
import { keys, queryClient, unwrap } from '@/data/query-client';
import { supabase } from '@/lib/supabase';
import type { Expense, TripSettlement } from '@/lib/types';

export function useSettlements(tripId: string) {
  return useQuery({
    queryKey: keys.settlements(tripId),
    queryFn: async () =>
      unwrap<TripSettlement[]>(
        await supabase.from('trip_settlements').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      ),
  });
}

export type NewSettlement = { from_user: string; to_user: string; amount: number; currency: string };

export function useAddSettlement(tripId: string) {
  return useMutation({
    mutationFn: async (input: NewSettlement) =>
      unwrap(await supabase.from('trip_settlements').insert({ ...input, trip_id: tripId })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.settlements(tripId) }),
  });
}

export function useDeleteSettlement(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('trip_settlements').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.settlements(tripId) }),
  });
}

export type Transfer = { from: string; to: string; amount: number };

/** Diferenças abaixo de 1 centavo contam como zero. */
const CENT = 0.005;

/**
 * Saldo de cada viajante na moeda da viagem: positivo = tem a receber, negativo = deve.
 * Gastos "divididos igualmente" são rateados entre todos os viajantes atuais; os outros são só de quem pagou.
 * Gastos sem cotação ficam de fora (contados em `skipped`).
 */
export function computeBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: TripSettlement[],
  currency: string,
  rates: Rates | null | undefined,
) {
  const balances = new Map<string, number>(memberIds.map((id) => [id, 0]));
  const add = (id: string, value: number) => balances.set(id, (balances.get(id) ?? 0) + value);
  let skipped = 0;

  for (const e of expenses) {
    if (!e.split_equally || memberIds.length < 2) continue;
    const value = convert(Number(e.amount), e.currency, currency, rates);
    if (value == null) {
      skipped += 1;
      continue;
    }
    add(e.paid_by, value);
    const share = value / memberIds.length;
    for (const id of memberIds) add(id, -share);
  }

  for (const s of settlements) {
    const value = convert(Number(s.amount), s.currency, currency, rates);
    if (value == null) {
      skipped += 1;
      continue;
    }
    add(s.from_user, value);
    add(s.to_user, -value);
  }

  return { balances, skipped };
}

/** Menor lista de pagamentos que zera os saldos: quem mais deve paga para quem mais tem a receber. */
export function suggestTransfers(balances: Map<string, number>): Transfer[] {
  const debtors = [...balances].filter(([, v]) => v < -CENT).map(([id, v]) => ({ id, value: -v }));
  const creditors = [...balances].filter(([, v]) => v > CENT).map(([id, v]) => ({ id, value: v }));
  debtors.sort((a, b) => b.value - a.value);
  creditors.sort((a, b) => b.value - a.value);

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].value, creditors[c].value);
    transfers.push({ from: debtors[d].id, to: creditors[c].id, amount: Math.round(amount * 100) / 100 });
    debtors[d].value -= amount;
    creditors[c].value -= amount;
    if (debtors[d].value <= CENT) d += 1;
    if (creditors[c].value <= CENT) c += 1;
  }
  return transfers.filter((t) => t.amount >= 0.01);
}

export function isSettled(value: number) {
  return Math.abs(value) <= CENT;
}
