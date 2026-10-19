import { useQuery } from '@tanstack/react-query';

import { useProfile } from '@/data/trips';
import { useAuth } from '@/providers/auth-provider';

/**
 * Cotações do dia (Banco Central Europeu) pela API gratuita e sem cadastro do Frankfurter.
 * https://frankfurter.dev — atualiza uma vez por dia útil; moedas fora da lista do BCE (ex.: ARS, CLP) não têm cotação.
 */
const API = 'https://api.frankfurter.dev/v2/rates';

/** Quanto vale 1 unidade da moeda base em cada outra moeda (inclui a própria base = 1). */
export type Rates = { base: string; date: string; values: Record<string, number> };

type ApiRate = { date: string; base: string; quote: string; rate: number };

export function useRates(base: string | undefined) {
  return useQuery({
    queryKey: ['rates', base],
    enabled: Boolean(base),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<Rates> => {
      const response = await fetch(`${API}?base=${encodeURIComponent(base!)}`);
      if (!response.ok) throw new Error(`Câmbio indisponível (${response.status})`);
      const list = (await response.json()) as ApiRate[];
      const values: Record<string, number> = { [base!]: 1 };
      let date = '';
      for (const r of list) {
        values[r.quote] = r.rate;
        if (r.date > date) date = r.date;
      }
      return { base: base!, date, values };
    },
  });
}

/** Converte usando cotações com base em `rates.base`. Devolve null se alguma moeda não tiver cotação. */
export function convert(amount: number, from: string, to: string, rates: Rates | undefined | null): number | null {
  if (from === to) return amount;
  if (!rates) return null;
  const fromRate = rates.values[from];
  const toRate = rates.values[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

/** Moeda de casa do usuário (Perfil › Moeda de casa), para mostrar os totais "em reais". */
export function useHomeCurrency(): string {
  const { session } = useAuth();
  const profile = useProfile(session?.user.id);
  return profile.data?.home_currency ?? 'BRL';
}
