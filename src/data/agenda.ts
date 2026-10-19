import type { IconName } from '@/components/ui/icon';
import { formatTime } from '@/lib/format';
import { ActivityCategoryLabels, ReservationKindLabels } from '@/lib/labels';
import type { Activity, Reservation, ReservationKind } from '@/lib/types';

export type AgendaItem = {
  key: string;
  /** "09:30" ou "" (sem horário). */
  time: string;
  title: string;
  subtitle: string;
  place: string | null;
  code: string | null;
  icon: IconName;
  /** Para abrir a edição ao tocar. */
  edit: { screen: 'atividade-nova' | 'reserva-nova'; id: string };
};

const kindIcon: Record<ReservationKind, IconName> = {
  voo: 'plane',
  hospedagem: 'ticket',
  transporte: 'ticket',
  carro: 'ticket',
  ingresso: 'ticket',
  outro: 'ticket',
};

/** O que acontece quando a reserva termina (o dia do fim também entra na agenda). */
const endLabel: Record<ReservationKind, string> = {
  voo: 'Chegada',
  hospedagem: 'Check-out',
  transporte: 'Chegada',
  carro: 'Devolução do carro',
  ingresso: 'Fim',
  outro: 'Fim',
};

const timeOf = (timestamp: string) => {
  const time = timestamp.slice(11, 16);
  return time === '00:00' ? '' : time;
};

/**
 * Agenda de um dia: atividades + reservas que começam ou terminam nele, em ordem de horário (sem horário no fim).
 * Reserva que já virou atividade do roteiro aparece uma vez só, como atividade com o código da reserva.
 */
export function buildDayAgenda(day: string, activities: Activity[], reservations: Reservation[]): AgendaItem[] {
  const byId = new Map(reservations.map((r) => [r.id, r]));
  const items: AgendaItem[] = [];
  const shownReservations = new Set<string>();

  for (const a of activities) {
    if (a.day !== day) continue;
    const reservation = a.reservation_id ? byId.get(a.reservation_id) : undefined;
    if (reservation) shownReservations.add(reservation.id);
    items.push({
      key: `a-${a.id}`,
      time: formatTime(a.start_time),
      title: a.title,
      subtitle: reservation ? ReservationKindLabels[reservation.kind] : ActivityCategoryLabels[a.category],
      place: a.place,
      code: reservation?.code ?? null,
      icon: reservation ? kindIcon[reservation.kind] : 'calendar',
      edit: { screen: 'atividade-nova', id: a.id },
    });
  }

  for (const r of reservations) {
    if (r.starts_at?.slice(0, 10) === day && !shownReservations.has(r.id)) {
      items.push({
        key: `r-${r.id}`,
        time: timeOf(r.starts_at),
        title: r.title,
        subtitle: ReservationKindLabels[r.kind],
        place: r.place,
        code: r.code,
        icon: kindIcon[r.kind],
        edit: { screen: 'reserva-nova', id: r.id },
      });
    }
    if (r.ends_at && r.ends_at.slice(0, 10) === day && r.starts_at?.slice(0, 10) !== day) {
      items.push({
        key: `r-end-${r.id}`,
        time: timeOf(r.ends_at),
        title: `${endLabel[r.kind]}: ${r.title}`,
        subtitle: ReservationKindLabels[r.kind],
        place: r.place,
        code: r.code,
        icon: kindIcon[r.kind],
        edit: { screen: 'reserva-nova', id: r.id },
      });
    }
  }

  return items.sort((x, y) => (x.time || '99').localeCompare(y.time || '99'));
}
