import { useMutation, useQuery } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useEffect } from 'react';

import { offlineMutation } from '@/data/offline';
import { keys, queryClient, unwrap } from '@/data/query-client';
import { supabase } from '@/lib/supabase';
import type { Activity, ActivityCategory, ChecklistItem, Expense, ExpenseCategory, Reservation, ReservationKind } from '@/lib/types';

// ── Roteiro ───────────────────────────────────────────────────

export function useActivities(tripId: string) {
  return useQuery({
    queryKey: keys.activities(tripId),
    queryFn: async () =>
      unwrap<Activity[]>(
        await supabase.from('activities').select('*').eq('trip_id', tripId).order('day').order('start_time', { nullsFirst: false }).order('created_at'),
      ),
  });
}

export type NewActivity = {
  day: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  category: ActivityCategory;
  place: string | null;
  estimated_cost: number | null;
  notes: string | null;
  /** Preenchido quando a atividade nasce de uma reserva (editar/excluir a reserva acompanha). */
  reservation_id?: string | null;
};

const byDayAndTime = (a: Activity, b: Activity) =>
  a.day.localeCompare(b.day) || (a.start_time ?? '99').localeCompare(b.start_time ?? '99') || a.created_at.localeCompare(b.created_at);

/** Funciona offline: aparece no roteiro na hora e vai para a nuvem quando houver conexão. */
export const useCreateActivity = offlineMutation<NewActivity & { id?: string }, Activity>({
  key: 'activity-create',
  prepare: (input) => ({ ...input, id: input.id ?? Crypto.randomUUID() }),
  send: async ({ tripId, ...input }) => unwrap(await supabase.from('activities').insert({ ...input, trip_id: tripId })),
  list: keys.activities,
  apply: (rows, { tripId, ...input }) =>
    [
      ...rows,
      { reservation_id: null, created_by: '', created_at: new Date().toISOString(), ...input, id: input.id!, trip_id: tripId },
    ].sort(byDayAndTime),
});

export const useUpdateActivity = offlineMutation<NewActivity & { id: string }, Activity>({
  key: 'activity-update',
  send: async ({ tripId: _tripId, id, ...input }) => unwrap(await supabase.from('activities').update(input).eq('id', id)),
  list: keys.activities,
  apply: (rows, { tripId: _tripId, ...input }) => rows.map((row) => (row.id === input.id ? { ...row, ...input } : row)).sort(byDayAndTime),
});

export const useDeleteActivity = offlineMutation<{ id: string }, Activity>({
  key: 'activity-delete',
  send: async ({ id }) => unwrap(await supabase.from('activities').delete().eq('id', id)),
  list: keys.activities,
  apply: (rows, { id }) => rows.filter((row) => row.id !== id),
});

// ── Reservas ──────────────────────────────────────────────────

export function useReservations(tripId: string) {
  return useQuery({
    queryKey: keys.reservations(tripId),
    queryFn: async () =>
      unwrap<Reservation[]>(
        await supabase.from('reservations').select('*').eq('trip_id', tripId).order('starts_at', { nullsFirst: false }),
      ),
  });
}

export type NewReservation = {
  kind: ReservationKind;
  title: string;
  code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  place: string | null;
  amount: number | null;
  currency: string;
};

function expenseCategoryFor(kind: ReservationKind): ExpenseCategory {
  if (kind === 'hospedagem') return 'hospedagem';
  if (kind === 'ingresso') return 'ingressos';
  if (kind === 'outro') return 'outros';
  return 'transporte';
}

/** Campos do gasto lançado a partir de uma reserva com valor pago. */
function expenseFieldsFromReservation(input: NewReservation) {
  return {
    description: input.title,
    category: expenseCategoryFor(input.kind),
    amount: input.amount,
    currency: input.currency,
    spent_on: (input.starts_at ?? new Date().toISOString()).slice(0, 10),
  };
}

function invalidateReservationData(tripId: string) {
  queryClient.invalidateQueries({ queryKey: keys.reservations(tripId) });
  queryClient.invalidateQueries({ queryKey: keys.expenses(tripId) });
  queryClient.invalidateQueries({ queryKey: keys.activities(tripId) });
}

/** Salva a reserva; com valor pago, também lança o gasto correspondente. */
export function useCreateReservation(tripId: string) {
  return useMutation({
    mutationFn: async ({ addExpense, ...input }: NewReservation & { addExpense: boolean }) => {
      const reservation = unwrap<Reservation>(
        await supabase.from('reservations').insert({ ...input, trip_id: tripId }).select('*').single(),
      );
      if (addExpense && input.amount) {
        unwrap(
          await supabase
            .from('expenses')
            .insert({ ...expenseFieldsFromReservation(input), trip_id: tripId, reservation_id: reservation.id }),
        );
      }
      return reservation;
    },
    onSuccess: () => invalidateReservationData(tripId),
  });
}

/**
 * Edita a reserva e mantém em dia o que nasceu dela: o gasto (criado, atualizado ou removido conforme o valor)
 * e a atividade do roteiro (título, local, dia e horário).
 */
export function useUpdateReservation(tripId: string) {
  return useMutation({
    mutationFn: async ({ id, ...input }: NewReservation & { id: string }) => {
      const reservation = unwrap<Reservation>(await supabase.from('reservations').update(input).eq('id', id).select('*').single());

      const linked = unwrap<{ id: string }[]>(await supabase.from('expenses').select('id').eq('reservation_id', id));
      if (input.amount && input.amount > 0) {
        if (linked.length > 0) {
          unwrap(await supabase.from('expenses').update(expenseFieldsFromReservation(input)).eq('reservation_id', id));
        } else {
          unwrap(
            await supabase.from('expenses').insert({ ...expenseFieldsFromReservation(input), trip_id: tripId, reservation_id: id }),
          );
        }
      } else if (linked.length > 0) {
        unwrap(await supabase.from('expenses').delete().eq('reservation_id', id));
      }

      const activityFields: Record<string, unknown> = { title: input.title, place: input.place };
      if (input.starts_at) {
        activityFields.day = input.starts_at.slice(0, 10);
        const time = input.starts_at.slice(11, 16);
        activityFields.start_time = time === '00:00' ? null : time;
      }
      unwrap(await supabase.from('activities').update(activityFields).eq('reservation_id', id));
      return reservation;
    },
    onSuccess: () => invalidateReservationData(tripId),
  });
}

/** Exclui a reserva junto com o gasto e a atividade que ela criou. */
export function useDeleteReservation(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('expenses').delete().eq('reservation_id', id));
      unwrap(await supabase.from('activities').delete().eq('reservation_id', id));
      unwrap(await supabase.from('reservations').delete().eq('id', id));
    },
    onSuccess: () => invalidateReservationData(tripId),
  });
}

// ── Gastos ────────────────────────────────────────────────────

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: keys.expenses(tripId),
    queryFn: async () =>
      unwrap<Expense[]>(
        await supabase.from('expenses').select('*').eq('trip_id', tripId).order('spent_on', { ascending: false }).order('created_at', { ascending: false }),
      ),
  });
}

export type NewExpense = {
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  spent_on: string;
  paid_by: string;
  split_equally: boolean;
};

const newestFirst = (a: Expense, b: Expense) => b.spent_on.localeCompare(a.spent_on) || b.created_at.localeCompare(a.created_at);

/** Funciona offline: entra nos gastos na hora e vai para a nuvem quando houver conexão. */
export const useCreateExpense = offlineMutation<NewExpense & { id?: string }, Expense>({
  key: 'expense-create',
  prepare: (input) => ({ ...input, id: input.id ?? Crypto.randomUUID() }),
  send: async ({ tripId, ...input }) => unwrap(await supabase.from('expenses').insert({ ...input, trip_id: tripId })),
  list: keys.expenses,
  apply: (rows, { tripId, ...input }) =>
    [
      {
        receipt_path: null,
        reservation_id: null,
        created_by: input.paid_by,
        created_at: new Date().toISOString(),
        ...input,
        id: input.id!,
        trip_id: tripId,
      },
      ...rows,
    ].sort(newestFirst),
});

export const useUpdateExpense = offlineMutation<NewExpense & { id: string }, Expense>({
  key: 'expense-update',
  send: async ({ tripId: _tripId, id, ...input }) => unwrap(await supabase.from('expenses').update(input).eq('id', id)),
  list: keys.expenses,
  apply: (rows, { tripId: _tripId, ...input }) => rows.map((row) => (row.id === input.id ? { ...row, ...input } : row)).sort(newestFirst),
});

export const useDeleteExpense = offlineMutation<{ id: string }, Expense>({
  key: 'expense-delete',
  send: async ({ id }) => unwrap(await supabase.from('expenses').delete().eq('id', id)),
  list: keys.expenses,
  apply: (rows, { id }) => rows.filter((row) => row.id !== id),
});

// ── Checklist ─────────────────────────────────────────────────

export function useChecklist(tripId: string) {
  return useQuery({
    queryKey: keys.checklist(tripId),
    queryFn: async () =>
      unwrap<ChecklistItem[]>(await supabase.from('checklist_items').select('*').eq('trip_id', tripId).order('position').order('created_at')),
  });
}

/** Marca/desmarca já na tela (também offline) e desfaz se a nuvem recusar. */
export const useToggleChecklistItem = offlineMutation<{ id: string; done: boolean }, ChecklistItem>({
  key: 'checklist-toggle',
  send: async ({ id, done }) => unwrap(await supabase.from('checklist_items').update({ done }).eq('id', id)),
  list: keys.checklist,
  apply: (rows, { id, done }) => rows.map((row) => (row.id === id ? { ...row, done } : row)),
});

export const useAddChecklistItem = offlineMutation<{ id?: string; label: string; group: string }, ChecklistItem>({
  key: 'checklist-add',
  prepare: (input) => ({ ...input, id: input.id ?? Crypto.randomUUID() }),
  send: async ({ tripId, id, label, group }) =>
    unwrap(await supabase.from('checklist_items').insert({ id, trip_id: tripId, label, group_name: group, position: 10_000 })),
  list: keys.checklist,
  apply: (rows, { tripId, id, label, group }) => [
    ...rows,
    { id: id!, trip_id: tripId, label, group_name: group, done: false, position: 10_000, created_at: new Date().toISOString() },
  ],
});

export const useDeleteChecklistItem = offlineMutation<{ id: string }, ChecklistItem>({
  key: 'checklist-delete',
  send: async ({ id }) => unwrap(await supabase.from('checklist_items').delete().eq('id', id)),
  list: keys.checklist,
  apply: (rows, { id }) => rows.filter((row) => row.id !== id),
});

// ── Tempo real ────────────────────────────────────────────────

const realtimeTables: Record<string, (tripId: string) => readonly unknown[]> = {
  activities: keys.activities,
  reservations: keys.reservations,
  expenses: keys.expenses,
  checklist_items: keys.checklist,
  trip_members: keys.members,
  contacts: keys.contacts,
  notes: keys.notes,
  documents: keys.documents,
  trip_settlements: keys.settlements,
};

/** Enquanto a viagem está aberta, mudanças de outros viajantes atualizam as telas na hora. */
export function useTripRealtime(tripId: string) {
  useEffect(() => {
    const channel = supabase.channel(`trip:${tripId}`);
    for (const [table, key] of Object.entries(realtimeTables)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `trip_id=eq.${tripId}` }, () =>
        queryClient.invalidateQueries({ queryKey: key(tripId) }),
      );
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, () => {
      queryClient.invalidateQueries({ queryKey: keys.trip(tripId) });
      queryClient.invalidateQueries({ queryKey: keys.trips });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);
}
