import { useMutation, useQuery } from '@tanstack/react-query';

import { keys, queryClient, unwrap } from '@/data/query-client';
import { DefaultChecklist } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { MemberRole, Profile, Trip, TripMember, TripType } from '@/lib/types';

export function useTrips() {
  return useQuery({
    queryKey: keys.trips,
    queryFn: async () =>
      unwrap<Trip[]>(await supabase.from('trips').select('*').is('archived_at', null).order('start_date', { ascending: true, nullsFirst: false })),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: keys.trip(id),
    queryFn: async () => unwrap<Trip>(await supabase.from('trips').select('*').eq('id', id).single()),
    initialData: () => queryClient.getQueryData<Trip[]>(keys.trips)?.find((trip) => trip.id === id),
  });
}

export function useTripMembers(id: string) {
  return useQuery({
    queryKey: keys.members(id),
    queryFn: async () =>
      unwrap<TripMember[]>(await supabase.from('trip_members').select('*, profiles(id, name)').eq('trip_id', id).order('joined_at')),
  });
}

export type NewTrip = {
  name: string;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  local_currency: string;
  budget: number | null;
  trip_type: TripType;
};

export function useCreateTrip() {
  return useMutation({
    mutationFn: async (input: NewTrip) => {
      const trip = unwrap<Trip>(await supabase.from('trips').insert(input).select('*').single());
      // Checklist sugerido para não começar do zero.
      const items = DefaultChecklist.flatMap((group, g) =>
        group.items.map((label, i) => ({ trip_id: trip.id, group_name: group.group, label, position: g * 100 + i })),
      );
      await supabase.from('checklist_items').insert(items);
      return trip;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.trips }),
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: keys.profile,
    enabled: Boolean(userId),
    queryFn: async () => unwrap<Profile>(await supabase.from('profiles').select('*').eq('id', userId!).single()),
  });
}

export function useUpdateProfile(userId: string | undefined) {
  return useMutation({
    mutationFn: async (input: Partial<Pick<Profile, 'name' | 'home_currency'>>) =>
      unwrap<Profile>(await supabase.from('profiles').update(input).eq('id', userId!).select('*').single()),
    onSuccess: (profile) => queryClient.setQueryData(keys.profile, profile),
  });
}

/** Viagens separadas como na tela "Minhas viagens". */
export function groupTrips(trips: Trip[], todayISO: string) {
  const upcoming: Trip[] = [];
  const planning: Trip[] = [];
  const past: Trip[] = [];
  for (const trip of trips) {
    if (!trip.start_date) planning.push(trip);
    else if ((trip.end_date ?? trip.start_date) < todayISO) past.push(trip);
    else upcoming.push(trip);
  }
  past.reverse();
  return { next: upcoming[0] ?? null, upcoming: upcoming.slice(1), planning, past };
}

export function useUpdateTrip(id: string) {
  return useMutation({
    mutationFn: async (input: Partial<NewTrip> & { invite_link_enabled?: boolean; archived_at?: string | null; timezone?: string | null }) =>
      unwrap<Trip>(await supabase.from('trips').update(input).eq('id', id).select('*').single()),
    onSuccess: (trip) => {
      queryClient.setQueryData(keys.trip(id), trip);
      queryClient.invalidateQueries({ queryKey: keys.trips });
    },
  });
}

export function useDeleteTrip(id: string) {
  return useMutation({
    mutationFn: async () => unwrap(await supabase.from('trips').delete().eq('id', id)),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: keys.trip(id) });
      queryClient.invalidateQueries({ queryKey: keys.trips });
    },
  });
}

export function useSetMemberRole(tripId: string) {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: MemberRole }) =>
      unwrap(await supabase.from('trip_members').update({ role }).eq('trip_id', tripId).eq('user_id', userId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.members(tripId) }),
  });
}

/** Remove alguém da viagem (ou a si mesmo, para sair). */
export function useRemoveMember(tripId: string) {
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrap(await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.members(tripId) });
      queryClient.invalidateQueries({ queryKey: keys.trips });
    },
  });
}

/** Total gasto por viagem já feita, numa consulta só (para a lista "Anteriores"). */
export function usePastTripExpenses(tripIds: string[]) {
  return useQuery({
    queryKey: ['past-expenses', tripIds.join(',')],
    enabled: tripIds.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async () =>
      unwrap<{ trip_id: string; amount: number; currency: string }[]>(
        await supabase.from('expenses').select('trip_id, amount, currency').in('trip_id', tripIds),
      ),
  });
}
