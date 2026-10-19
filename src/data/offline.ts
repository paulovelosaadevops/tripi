import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { onlineManager, useMutation, useMutationState, type QueryKey } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import '@/lib/local-storage';
import { queryClient } from '@/data/query-client';

/**
 * Modo offline:
 * - o cache do React Query fica salvo no aparelho (`localStorage`: SQLite no celular, navegador na web) e
 *   volta ao abrir o app, então tudo o que já foi visto abre sem internet;
 * - alterações feitas sem internet ficam numa fila (mutações pausadas, também salvas), aparecem na tela na
 *   hora e são enviadas em ordem quando a conexão volta — mesmo que o app tenha sido fechado no meio.
 */

/**
 * Quanto tempo o cache salvo vale (e quanto tempo dados sem uso ficam em memória).
 * Precisa ficar abaixo de ~24,8 dias: acima disso o setTimeout do JavaScript estoura e dispara na hora,
 * apagando o cache recém-restaurado.
 */
export const CACHE_MAX_AGE = 20 * 24 * 60 * 60 * 1000;

export const persister = createSyncStoragePersister({
  storage: globalThis.localStorage,
  key: 'tripi-cache',
  // Grava quase na hora: uma alteração feita offline não pode se perder se o app for fechado logo em seguida.
  throttleTime: 100,
});

/** Muda quando o formato do cache muda, para descartar o cache antigo. */
export const CACHE_BUSTER = 'v1';

// No celular, a conexão vem do expo-network. Na web o React Query escuta os eventos online/offline, mas só a
// partir da primeira mudança: quem já abre o app sem internet precisa do estado inicial do navegador.
if (Platform.OS === 'web') {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) onlineManager.setOnline(false);
} else {
  onlineManager.setEventListener((setOnline) => {
    const apply = (state: Network.NetworkState) => setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    Network.getNetworkStateAsync().then(apply).catch(() => undefined);
    const subscription = Network.addNetworkStateListener(apply);
    return () => subscription.remove();
  });
}

export function useIsOnline() {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}

/** Quantas alterações ainda não chegaram à nuvem (na fila ou sendo enviadas). */
export function usePendingChanges() {
  return useMutationState({ filters: { status: 'pending' } }).length;
}

/**
 * Salva: com internet, espera a nuvem confirmar (e mostra erro se falhar); sem internet, põe na fila e segue —
 * a tela já mostra a mudança e ela é enviada depois.
 */
export async function commit<V>(mutation: { mutate: (v: V) => void; mutateAsync: (v: V) => Promise<unknown> }, variables: V) {
  if (onlineManager.isOnline()) {
    await mutation.mutateAsync(variables);
  } else {
    mutation.mutate(variables);
  }
}

// ── Mutações que funcionam offline ─────────────────────────────

/** Todas na mesma fila: são enviadas na ordem em que foram feitas (criar antes de editar, etc.). */
const scope = { id: 'tripi-offline' };

type OfflineMutation<I, Row extends { id: string }> = {
  key: string;
  /** Envia para o Supabase. Recebe também o id da viagem. */
  send: (input: I & { tripId: string }) => Promise<unknown>;
  /** Lista em cache que muda com esta alteração. */
  list: (tripId: string) => QueryKey;
  /** Como a lista fica logo após a alteração (antes de a nuvem responder). */
  apply: (rows: Row[], input: I & { tripId: string }) => Row[];
  /** Completa a entrada antes de ir para a fila (ex.: gera o id de um item novo já no aparelho). */
  prepare?: (input: I) => I;
  /** Outras listas para atualizar depois de enviar. */
  alsoInvalidate?: (tripId: string) => QueryKey[];
};

/**
 * Registra a mutação no React Query (para retomar a fila salva depois de reabrir o app, a função precisa
 * estar registrada pelo nome) e devolve o hook para usar nas telas.
 */
export function offlineMutation<I, Row extends { id: string }>(config: OfflineMutation<I, Row>) {
  type V = I & { tripId: string };
  queryClient.setMutationDefaults([config.key], {
    mutationFn: (variables: V) => config.send(variables),
    scope,
    retry: 3,
    onMutate: async (variables: V) => {
      const key = config.list(variables.tripId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData<Row[]>(key, (rows) => (rows ? config.apply(rows, variables) : rows));
      return { previous };
    },
    onError: (_error, variables: V, context) => {
      const previous = (context as { previous?: unknown } | undefined)?.previous;
      if (previous !== undefined) queryClient.setQueryData(config.list(variables.tripId), previous);
    },
    onSettled: (_data, _error, variables: V) => {
      queryClient.invalidateQueries({ queryKey: config.list(variables.tripId) });
      for (const key of config.alsoInvalidate?.(variables.tripId) ?? []) queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return function useOfflineMutation(tripId: string) {
    const mutation = useMutation<unknown, Error, V>({ mutationKey: [config.key] });
    return {
      isPending: mutation.isPending && !mutation.isPaused,
      isError: mutation.isError,
      error: mutation.error,
      mutate: (input: I) => mutation.mutate({ ...(config.prepare?.(input) ?? input), tripId } as V),
      mutateAsync: (input: I) => mutation.mutateAsync({ ...(config.prepare?.(input) ?? input), tripId } as V),
    };
  };
}
