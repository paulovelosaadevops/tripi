import type { Expense, ExpenseCategory, Trip } from '@/lib/types';

/**
 * Resumo do orçamento na moeda local da viagem.
 * Gastos em outra moeda ficam fora do total até o câmbio entrar (próxima etapa).
 */
export function summarizeBudget(trip: Trip, expenses: Expense[], travelers: number) {
  const local = expenses.filter((e) => e.currency === trip.local_currency);
  const spent = local.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of local) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const budget = trip.budget == null ? null : Number(trip.budget);
  return {
    spent,
    budget,
    remaining: budget == null ? null : budget - spent,
    progress: budget ? spent / budget : 0,
    perPerson: travelers > 0 ? spent / travelers : spent,
    categories,
    otherCurrencies: expenses.length - local.length,
  };
}
