import type { IconName } from '@/components/ui/icon';
import { eachDay, formatDayMonth, parseISODate, toISODate } from '@/lib/format';
import type { ChecklistItem, Reservation, Trip, TripDocument } from '@/lib/types';

/** Uma pendência da viagem, com a tela que resolve. */
export type PrepStep = { key: string; icon: IconName; text: string; screen: string; urgent?: boolean };

const addMonths = (iso: string, months: number) => {
  const d = parseISODate(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
};

/** Noites da viagem sem nenhuma hospedagem cobrindo (check-in ≤ noite < check-out). */
function nightsWithoutLodging(trip: Trip, reservations: Reservation[]): string[] {
  if (!trip.start_date || !trip.end_date || trip.end_date <= trip.start_date) return [];
  const nights = eachDay(trip.start_date, trip.end_date).slice(0, -1);
  const stays = reservations.filter((r) => r.kind === 'hospedagem' && r.starts_at);
  return nights.filter(
    (night) =>
      !stays.some((r) => {
        const checkIn = r.starts_at!.slice(0, 10);
        const checkOut = r.ends_at?.slice(0, 10) ?? checkIn;
        return checkIn <= night && (night < checkOut || night === checkIn);
      }),
  );
}

function listDays(days: string[]) {
  const shown = days.slice(0, 3).map(formatDayMonth);
  return days.length > 3 ? `${shown.join(', ')}…` : shown.join(', ');
}

/**
 * O que ainda falta para a viagem e quanto já está pronto.
 * Pronto = itens do checklist marcados + verificações que passaram (hospedagem, voos com código, documentos).
 */
export function preparation(
  trip: Trip,
  data: { checklist: ChecklistItem[]; reservations: Reservation[]; documents: TripDocument[]; remindersOn: boolean; userId?: string },
  today = toISODate(new Date()),
) {
  const steps: PrepStep[] = [];
  let checks = 0;
  let passed = 0;
  const check = (ok: boolean) => {
    checks += 1;
    if (ok) passed += 1;
    return ok;
  };

  // Documentos: vencendo antes da volta, ou passaporte com menos de 6 meses de validade depois dela.
  const back = trip.end_date ?? trip.start_date;
  if (back) {
    for (const doc of data.documents) {
      if (!doc.expires_on) continue;
      const limit = doc.kind === 'passaporte' ? addMonths(back, 6) : back;
      if (!check(doc.expires_on >= limit)) {
        steps.push({
          key: `doc-${doc.id}`,
          icon: 'alert',
          urgent: true,
          text:
            doc.kind === 'passaporte' && doc.expires_on >= back
              ? `${doc.name}: validade menor que 6 meses após a volta`
              : `${doc.name} vence antes do fim da viagem`,
          screen: `documento/${doc.id}`,
        });
      }
    }
  }

  // Hospedagem para todas as noites.
  const missing = nightsWithoutLodging(trip, data.reservations);
  const hasNights = Boolean(trip.start_date && trip.end_date && trip.end_date > trip.start_date);
  if (hasNights && !check(missing.length === 0)) {
    const anyStay = data.reservations.some((r) => r.kind === 'hospedagem');
    steps.push({
      key: 'hospedagem',
      icon: 'ticket',
      text: anyStay
        ? `Sem hospedagem em ${missing.length === 1 ? '1 noite' : `${missing.length} noites`} (${listDays(missing)})`
        : 'Nenhuma hospedagem cadastrada ainda',
      screen: 'reservas',
    });
  }

  // Voos com código (o código é o que se pede no check-in).
  const flights = data.reservations.filter((r) => r.kind === 'voo');
  const noCode = flights.filter((r) => !r.code);
  if (flights.length > 0 && !check(noCode.length === 0)) {
    steps.push({
      key: 'voo-codigo',
      icon: 'plane',
      text: noCode.length === 1 ? `Voo sem código de reserva: ${noCode[0].title}` : `${noCode.length} voos sem código de reserva`,
      screen: 'carteira',
    });
  }

  // Checklist.
  const pending = data.checklist.filter((i) => !i.done);
  const mine = pending.filter((i) => i.assigned_to && i.assigned_to === data.userId);
  if (pending.length > 0) {
    steps.push({
      key: 'checklist',
      icon: 'checklist',
      text:
        mine.length > 0
          ? `${pending.length} ${pending.length === 1 ? 'item falta' : 'itens faltam'} no checklist (${mine.length} com você)`
          : `${pending.length} ${pending.length === 1 ? 'item falta' : 'itens faltam'} no checklist`,
      screen: 'checklist',
    });
  }

  // Lembretes: só cobra quando a viagem está perto (30 dias).
  const soon = trip.start_date ? (parseISODate(trip.start_date).getTime() - parseISODate(today).getTime()) / 86_400_000 <= 30 : false;
  if (soon && !data.remindersOn && (trip.end_date ?? trip.start_date ?? '') >= today) {
    steps.push({ key: 'lembretes', icon: 'bell', text: 'Lembretes desligados nesta viagem', screen: 'lembretes' });
  }

  const doneItems = data.checklist.length - pending.length;
  const total = data.checklist.length + checks;
  return {
    steps: steps.sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent))),
    progress: total > 0 ? (doneItems + passed) / total : 0,
    ready: doneItems + passed,
    total,
  };
}
