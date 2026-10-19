import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

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

export function useCreateActivity(tripId: string) {
  return useMutation({
    mutationFn: async (input: NewActivity) =>
      unwrap<Activity>(await supabase.from('activities').insert({ ...input, trip_id: tripId }).select('*').single()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.activities(tripId) }),
  });
}

export function useUpdateActivity(tripId: string) {
  return useMutation({
    mutationFn: async ({ id, ...input }: NewActivity & { id: string }) =>
      unwrap<Activity>(await supabase.from('activities').update(input).eq('id', id).select('*').single()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.activities(tripId) }),
  });
}

export function useDeleteActivity(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('activities').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.activities(tripId) }),
  });
}

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

export function useCreateExpense(tripId: string) {
  return useMutation({
    mutationFn: async (input: NewExpense) =>
      unwrap<Expense>(await supabase.from('expenses').insert({ ...input, trip_id: tripId }).select('*').single()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.expenses(tripId) }),
  });
}

export function useUpdateExpense(tripId: string) {
  return useMutation({
    mutationFn: async ({ id, ...input }: NewExpense & { id: string }) =>
      unwrap<Expense>(await supabase.from('expenses').update(input).eq('id', id).select('*').single()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.expenses(tripId) }),
  });
}

export function useDeleteExpense(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('expenses').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.expenses(tripId) }),
  });
}

// ── Checklist ─────────────────────────────────────────────────

export function useChecklist(tripId: string) {
  return useQuery({
    queryKey: keys.checklist(tripId),
    queryFn: async () =>
      unwrap<ChecklistItem[]>(await supabase.from('checklist_items').select('*').eq('trip_id', tripId).order('position').order('created_at')),
  });
}

/** Marca/desmarca já na tela e desfaz se a nuvem recusar. */
export function useToggleChecklistItem(tripId: string) {
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) =>
      unwrap(await supabase.from('checklist_items').update({ done }).eq('id', id)),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: keys.checklist(tripId) });
      const previous = queryClient.getQueryData<ChecklistItem[]>(keys.checklist(tripId));
      queryClient.setQueryData<ChecklistItem[]>(keys.checklist(tripId), (items) =>
        items?.map((item) => (item.id === id ? { ...item, done } : item)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => queryClient.setQueryData(keys.checklist(tripId), context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.checklist(tripId) }),
  });
}

export function useAddChecklistItem(tripId: string) {
  return useMutation({
    mutationFn: async ({ label, group }: { label: string; group: string }) =>
      unwrap(await supabase.from('checklist_items').insert({ trip_id: tripId, label, group_name: group, position: 10_000 })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.checklist(tripId) }),
  });
}

export function useDeleteChecklistItem(tripId: string) {
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('checklist_items').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.checklist(tripId) }),
  });
}

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
