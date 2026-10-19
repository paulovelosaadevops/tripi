// Tripi — lembretes por notificação (Web Push).
//
// Chamada a cada 10 minutos pelo agendador do banco (pg_cron) com o cabeçalho x-cron-secret: procura voos,
// atividades, check-outs etc. que estão chegando e avisa cada aparelho uma única vez.
// Com { "simular": true, "agora": "…" } (e o segredo): só lista o que seria enviado — para diagnóstico.
// Chamada pelo app com o login do usuário e { "teste": true }: manda uma notificação de teste para ele.
//
// Segredos (Edge Functions › Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…), CRON_SECRET.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm do próprio Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import webpush from 'npm:web-push@3.6.7';

type Settings = { user_id: string; trip_id: string; enabled: boolean; flight_minutes: number; activity_minutes: number; checkout_minutes: number };
type Subscription = { endpoint: string; user_id: string; p256dh: string; auth: string; timezone: string | null };
type Trip = { id: string; name: string; timezone: string | null };
type Reservation = { id: string; trip_id: string; kind: string; title: string; code: string | null; starts_at: string | null; ends_at: string | null; place: string | null };
type Activity = { id: string; trip_id: string; day: string; start_time: string | null; title: string; place: string | null; reservation_id: string | null };
type Reminder = { key: string; at: number; lead: number; title: string; body: string; url: string };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:tripi@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

/** "2027-09-10T18:30" no fuso `timeZone` → instante (ms desde 1970). */
function localToInstant(local: string, timeZone: string): number {
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(instant));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - instant;
  };
  const first = guess - offsetAt(guess);
  return guess - offsetAt(first);
}

function validZone(zone: string | null | undefined): string | null {
  if (!zone) return null;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}

const hoursText = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} h` : minutes > 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;

/** Tudo o que pode gerar lembrete numa viagem, com o horário (local do destino) e a antecedência. */
function remindersFor(trip: Trip, settings: Settings, zone: string, reservations: Reservation[], activities: Activity[]): Reminder[] {
  const list: Reminder[] = [];
  const url = `/viagem/${trip.id}`;
  const timed = (value: string | null) => (value && value.slice(11, 16) !== '00:00' ? value.slice(0, 16) : null);
  const code = (r: Reservation) => (r.code ? ` · código ${r.code}` : '');

  for (const r of reservations) {
    const start = timed(r.starts_at);
    if (start && r.kind !== 'hospedagem') {
      const isFlight = r.kind === 'voo';
      const lead = isFlight ? settings.flight_minutes : settings.activity_minutes;
      const what = isFlight ? 'Voo' : r.kind === 'carro' ? 'Retirada do carro' : r.kind === 'transporte' ? 'Embarque' : 'Começa';
      list.push({
        key: `inicio:${r.id}:${start}:${lead}`,
        at: localToInstant(start, zone),
        lead,
        title: `${isFlight ? '✈️' : '⏰'} ${what} em ${hoursText(lead)}`,
        body: `${r.title} às ${start.slice(11)}${code(r)}${r.place ? ` · ${r.place}` : ''}`,
        url,
      });
    }
    const end = timed(r.ends_at);
    if (end && (r.kind === 'hospedagem' || r.kind === 'carro')) {
      const lead = settings.checkout_minutes;
      list.push({
        key: `fim:${r.id}:${end}:${lead}`,
        at: localToInstant(end, zone),
        lead,
        title: `🧳 ${r.kind === 'hospedagem' ? 'Check-out' : 'Devolução do carro'} em ${hoursText(lead)}`,
        body: `${r.title} até ${end.slice(11)}${code(r)}`,
        url,
      });
    }
  }

  for (const a of activities) {
    // Atividade criada por uma reserva já é avisada pela reserva.
    if (!a.start_time || a.reservation_id) continue;
    const local = `${a.day}T${a.start_time.slice(0, 5)}`;
    const lead = settings.activity_minutes;
    list.push({
      key: `atividade:${a.id}:${local}:${lead}`,
      at: localToInstant(local, zone),
      lead,
      title: `📍 Em ${hoursText(lead)}: ${a.title}`,
      body: `Às ${a.start_time.slice(0, 5)}${a.place ? ` · ${a.place}` : ''} — ${trip.name}`,
      url,
    });
  }
  return list;
}

/**
 * Envia para todos os aparelhos da pessoa; aparelhos que não existem mais saem da lista.
 * `failed` conta falhas passageiras (serviço fora do ar etc.), que valem nova tentativa.
 */
async function notify(subscriptions: Subscription[], payload: { title: string; body: string; url: string }) {
  let delivered = 0;
  let failed = 0;
  for (const s of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
      delivered += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      else {
        failed += 1;
        console.error('push falhou', status, (error as Error).message);
      }
    }
  }
  return { delivered, failed };
}

/** `simulate`: só calcula o que seria enviado agora (diagnóstico), sem enviar nem registrar. */
async function runBatch(now: number, simulate = false) {
  const { data: settings } = await supabase.from('reminder_settings').select('*').eq('enabled', true);
  if (!settings?.length) return { sent: 0, due: [] };
  const userIds = [...new Set(settings.map((s: Settings) => s.user_id))];
  const tripIds = [...new Set(settings.map((s: Settings) => s.trip_id))];

  // Só o que acontece entre ontem e daqui a 3 dias (a maior antecedência possível é 24 h).
  const from = new Date(now - 36 * 3600_000).toISOString().slice(0, 10);
  const to = new Date(now + 72 * 3600_000).toISOString().slice(0, 10);
  const [subs, trips, reservations, activities] = await Promise.all([
    supabase.from('push_subscriptions').select('*').in('user_id', userIds),
    supabase.from('trips').select('id, name, timezone').in('id', tripIds),
    supabase.from('reservations').select('id, trip_id, kind, title, code, starts_at, ends_at, place').in('trip_id', tripIds)
      .or(`and(starts_at.gte.${from},starts_at.lte.${to}T23:59),and(ends_at.gte.${from},ends_at.lte.${to}T23:59)`),
    supabase.from('activities').select('id, trip_id, day, start_time, title, place, reservation_id').in('trip_id', tripIds).gte('day', from).lte('day', to),
  ]);

  let sent = 0;
  const simulated: { user: string; key: string; title: string; body: string }[] = [];
  const logged = simulate
    ? new Set(((await supabase.from('reminder_log').select('user_id, event_key').in('user_id', userIds)).data ?? []).map((l: { user_id: string; event_key: string }) => `${l.user_id}|${l.event_key}`))
    : null;
  for (const s of settings as Settings[]) {
    const userSubs = ((subs.data ?? []) as Subscription[]).filter((x) => x.user_id === s.user_id);
    const trip = ((trips.data ?? []) as Trip[]).find((t) => t.id === s.trip_id);
    if (!userSubs.length || !trip) continue;
    const zone = validZone(trip.timezone) ?? validZone(userSubs[0].timezone) ?? 'America/Sao_Paulo';
    const due = remindersFor(
      trip,
      s,
      zone,
      ((reservations.data ?? []) as Reservation[]).filter((r) => r.trip_id === trip.id),
      ((activities.data ?? []) as Activity[]).filter((a) => a.trip_id === trip.id),
    ).filter((r) => now >= r.at - r.lead * 60_000 && now < r.at);

    for (const reminder of due) {
      if (logged) {
        if (!logged.has(`${s.user_id}|${reminder.key}`)) simulated.push({ user: s.user_id, key: reminder.key, title: reminder.title, body: reminder.body });
        continue;
      }
      // Grava antes de enviar: se já existia, outra execução já avisou.
      const { error } = await supabase.from('reminder_log').insert({ user_id: s.user_id, event_key: reminder.key });
      if (error) continue;
      const result = await notify(userSubs, reminder);
      sent += result.delivered;
      // Ninguém recebeu por falha passageira: libera para tentar de novo na próxima rodada (ainda dentro da janela).
      if (result.delivered === 0 && result.failed > 0) {
        await supabase.from('reminder_log').delete().eq('user_id', s.user_id).eq('event_key', reminder.key);
      }
    }
  }
  return simulate ? { sent: 0, due: simulated } : { sent };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') === cronSecret) {
    const body = await req.json().catch(() => ({}));
    const now = typeof body.agora === 'string' ? Date.parse(body.agora) : Date.now();
    return json(await runBatch(now, body.simular === true));
  }

  // Teste pelo app: só para o próprio usuário logado.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!data.user) return json({ error: 'não autorizado' }, 401);
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', data.user.id);
  if (!subs?.length) return json({ error: 'sem aparelho', sent: 0 }, 404);
  const { delivered: sent } = await notify(subs as Subscription[], {
    title: '🔔 Lembretes do Tripi ativados',
    body: 'É assim que os avisos de voo, check-out e atividades vão aparecer.',
    url: '/',
  });
  return json({ sent });
});
