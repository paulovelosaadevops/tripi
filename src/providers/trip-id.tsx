import { createContext, useContext, type PropsWithChildren } from 'react';

/**
 * O id da viagem vem do layout `viagem/[id]`. As abas e telas internas leem daqui, porque
 * os parâmetros de rota da aba nem sempre trazem o segmento dinâmico do pai ao trocar de aba.
 */
const TripIdContext = createContext<string | null>(null);

export function TripIdProvider({ id, children }: PropsWithChildren<{ id: string }>) {
  return <TripIdContext.Provider value={id}>{children}</TripIdContext.Provider>;
}

export function useTripId(): string {
  const id = useContext(TripIdContext);
  if (!id) {
    throw new Error('useTripId precisa estar dentro de viagem/[id]');
  }
  return id;
}
