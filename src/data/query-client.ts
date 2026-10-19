import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // O cache fica salvo no aparelho (modo offline): dados sem uso não podem sumir antes disso.
      // Mesmo valor de CACHE_MAX_AGE (data/offline.ts); acima de ~24,8 dias o setTimeout estoura.
      gcTime: 20 * 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});

/** Chaves do cache — uma lista por viagem para cada tipo de conteúdo. */
export const keys = {
  trips: ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  members: (id: string) => ['members', id] as const,
  activities: (id: string) => ['activities', id] as const,
  reservations: (id: string) => ['reservations', id] as const,
  expenses: (id: string) => ['expenses', id] as const,
  checklist: (id: string) => ['checklist', id] as const,
  contacts: (id: string) => ['contacts', id] as const,
  notes: (id: string) => ['notes', id] as const,
  documents: (id: string) => ['documents', id] as const,
  settlements: (id: string) => ['settlements', id] as const,
  profile: ['profile'] as const,
};

/** Lança o erro do Supabase para o React Query tratar. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
