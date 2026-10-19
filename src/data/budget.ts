import { convert, type Rates } from '@/data/exchange';
import type { Expense, ExpenseCategory, Trip } from '@/lib/types';

/**
 * Resumo do orçamento na moeda local da viagem.
 * Gastos em outra moeda entram convertidos pela cotação do dia; sem cotação, ficam fora do total.
 */
export function summarizeBudget(trip: Trip, expenses: Expense[], travelers: number, rates?: Rates | null) {
  let spent = 0;
  let unconverted = 0;
  let foreign = 0;
  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    const value = convert(Number(e.amount), e.currency, trip.local_currency, rates);
    if (value == null) {
      unconverted += 1;
      continue;
    }
    if (e.currency !== trip.local_currency) foreign += 1;
    spent += value;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + value);
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
    otherCurrencies: unconverted,
    /** Quantos gastos em outra moeda entraram no total convertidos pelo câmbio. */
    converted: foreign,
  };
}
