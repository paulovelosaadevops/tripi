import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient, unwrap } from '@/data/query-client';
import { supabase } from '@/lib/supabase';
import type { Activity, Reservation } from '@/lib/types';

/** Preferências de lembrete desta pessoa nesta viagem (sem linha salva = padrão, desligado). */
export type ReminderSettings = {
  enabled: boolean;
  flight_minutes: number;
  activity_minutes: number;
  checkout_minutes: number;
};

export const defaultReminderSettings: ReminderSettings = { enabled: false, flight_minutes: 180, activity_minutes: 60, checkout_minutes: 60 };

const key = (tripId: string) => ['reminder-settings', tripId] as const;

export function useReminderSettings(tripId: string) {
  return useQuery({
    queryKey: key(tripId),
    queryFn: async () => {
      const row = unwrap<ReminderSettings | null>(
        await supabase.from('reminder_settings').select('enabled, flight_minutes, activity_minutes, checkout_minutes').eq('trip_id', tripId).maybeSingle(),
      );
      return row ?? defaultReminderSettings;
    },
  });
}

export function useSaveReminderSettings(tripId: string) {
  return useMutation({
    mutationFn: async (settings: ReminderSettings) => {
      const { data } = await supabase.auth.getUser();
      unwrap(
        await supabase
          .from('reminder_settings')
          .upsert({ ...settings, trip_id: tripId, user_id: data.user!.id, updated_at: new Date().toISOString() }),
      );
      return settings;
    },
    onMutate: (settings) => queryClient.setQueryData(key(tripId), settings),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key(tripId) }),
  });
}

/** Pede à função `lembretes` uma notificação de teste para os aparelhos do usuário. */
export async function sendTestNotification(): Promise<number> {
  const { data, error } = await supabase.functions.invoke('lembretes', { body: { teste: true } });
  if (error) throw error;
  return (data as { sent?: number }).sent ?? 0;
}

export type UpcomingReminder = { key: string; notifyAt: string; title: string };

const minus = (local: string, minutes: number) => {
  const [d, t] = local.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  const date = new Date(Date.UTC(y, m - 1, day, hh, mm) - minutes * 60_000);
  return date.toISOString().slice(0, 16);
};

/**
 * Prévia dos próximos avisos (mesmas regras da função do servidor), em horário local do destino.
 * `nowLocal` = agora no fuso do destino, "AAAA-MM-DDTHH:MM".
 */
export function upcomingReminders(
  settings: ReminderSettings,
  reservations: Reservation[],
  activities: Activity[],
  nowLocal: string,
  limit = 5,
): UpcomingReminder[] {
  const list: (UpcomingReminder & { at: string })[] = [];
  const timed = (value: string | null) => (value && value.slice(11, 16) !== '00:00' ? value.slice(0, 16) : null);
  for (const r of reservations) {
    const start = timed(r.starts_at);
    if (start && r.kind !== 'hospedagem') {
      const lead = r.kind === 'voo' ? settings.flight_minutes : settings.activity_minutes;
      list.push({ key: `i-${r.id}`, at: start, notifyAt: minus(start, lead), title: r.kind === 'voo' ? `Voo: ${r.title}` : r.title });
    }
    const end = timed(r.ends_at);
    if (end && (r.kind === 'hospedagem' || r.kind === 'carro')) {
      list.push({
        key: `f-${r.id}`,
        at: end,
        notifyAt: minus(end, settings.checkout_minutes),
        title: `${r.kind === 'hospedagem' ? 'Check-out' : 'Devolução do carro'}: ${r.title}`,
      });
    }
  }
  for (const a of activities) {
    if (!a.start_time || a.reservation_id) continue;
    const at = `${a.day}T${a.start_time.slice(0, 5)}`;
    list.push({ key: `a-${a.id}`, at, notifyAt: minus(at, settings.activity_minutes), title: a.title });
  }
  return list
    .filter((r) => r.at > nowLocal)
    .sort((x, y) => x.notifyAt.localeCompare(y.notifyAt))
    .slice(0, limit)
    .map(({ key: k, notifyAt, title }) => ({ key: k, notifyAt, title }));
}

/** Agora no fuso `timeZone` (ou do aparelho), "AAAA-MM-DDTHH:MM". */
export function nowIn(timeZone: string | null | undefined): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone ?? undefined,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}
