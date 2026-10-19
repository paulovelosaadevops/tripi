import { summarizeBudget } from '@/data/budget';
import type { Rates } from '@/data/exchange';
import { formatDateRange, formatMoney, formatTime, formatWeekdayDayMonth } from '@/lib/format';
import { ActivityCategoryLabels, ExpenseCategoryLabels, ReservationKindLabels } from '@/lib/labels';
import type { Activity, ChecklistItem, Contact, Expense, Reservation, Trip } from '@/lib/types';

export type ExportSections = {
  itinerary: boolean;
  reservations: boolean;
  expenses: boolean;
  checklist: boolean;
  contacts: boolean;
};

export type ExportData = {
  trip: Trip;
  travelers: number;
  activities: Activity[];
  reservations: Reservation[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  contacts: Contact[];
  rates?: Rates | null;
};

const esc = (value: string | null | undefined) =>
  (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML do PDF no visual do Tripi (verde-escuro + damasco, Manrope com fallback do sistema). */
export function buildTripHtml(data: ExportData, sections: ExportSections): string {
  const { trip } = data;
  const parts: string[] = [];

  if (sections.itinerary) {
    const byDay = new Map<string, Activity[]>();
    for (const a of data.activities) byDay.set(a.day, [...(byDay.get(a.day) ?? []), a]);
    const days = [...byDay.keys()].sort();
    parts.push(`<h2>Roteiro</h2>${
      days.length === 0
        ? '<p class="muted">Nenhuma atividade no roteiro.</p>'
        : days
            .map(
              (day) => `<h3>${esc(formatWeekdayDayMonth(day))}</h3><table>${byDay
                .get(day)!
                .map(
                  (a) =>
                    `<tr><td class="time">${esc(formatTime(a.start_time)) || '—'}</td><td><b>${esc(a.title)}</b>${
                      a.place ? `<br><span class="muted">${esc(a.place)}</span>` : ''
                    }${a.notes ? `<br><span class="muted">${esc(a.notes)}</span>` : ''}</td><td class="tag">${esc(ActivityCategoryLabels[a.category])}</td></tr>`,
                )
                .join('')}</table>`,
            )
            .join('')
    }`);
  }

  if (sections.reservations) {
    parts.push(`<h2>Reservas</h2>${
      data.reservations.length === 0
        ? '<p class="muted">Nenhuma reserva.</p>'
        : `<table>${data.reservations
            .map(
              (r) =>
                `<tr><td class="tag">${esc(ReservationKindLabels[r.kind])}</td><td><b>${esc(r.title)}</b><br><span class="muted">${esc(
                  [r.starts_at ? `${formatWeekdayDayMonth(r.starts_at.slice(0, 10))} ${r.starts_at.slice(11, 16)}` : '', r.place].filter(Boolean).join(' · '),
                )}</span></td><td class="code">${esc(r.code)}</td></tr>`,
            )
            .join('')}</table>`
    }`);
  }

  if (sections.expenses) {
    const s = summarizeBudget(trip, data.expenses, data.travelers, data.rates);
    parts.push(`<h2>Gastos</h2>
      <p><b>${esc(formatMoney(s.spent, trip.local_currency))}</b>${s.budget != null ? ` de ${esc(formatMoney(s.budget, trip.local_currency))}` : ''} · ${esc(
        formatMoney(s.perPerson, trip.local_currency),
      )} por pessoa</p>
      <table>${data.expenses
        .map(
          (e) =>
            `<tr><td>${esc(e.description)}<br><span class="muted">${esc(ExpenseCategoryLabels[e.category])} · ${esc(
              formatWeekdayDayMonth(e.spent_on),
            )}</span></td><td class="right">${esc(formatMoney(Number(e.amount), e.currency))}</td></tr>`,
        )
        .join('')}</table>`);
  }

  if (sections.checklist) {
    parts.push(`<h2>Checklist</h2><ul class="check">${data.checklist
      .map((i) => `<li>${i.done ? '☑' : '☐'} ${esc(i.label)}</li>`)
      .join('')}</ul>`);
  }

  if (sections.contacts) {
    parts.push(`<h2>Contatos de emergência</h2>${
      data.contacts.length === 0
        ? '<p class="muted">Nenhum contato.</p>'
        : `<table>${data.contacts
            .map((c) => `<tr><td><b>${esc(c.name)}</b>${c.notes ? `<br><span class="muted">${esc(c.notes)}</span>` : ''}</td><td class="right">${esc(c.phone)}</td></tr>`)
            .join('')}</table>`
    }`);
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(trip.name)} · Tripi</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 14mm; }
  body { font-family: Manrope, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #10201C; margin: 0; font-size: 12pt; }
  header { background: #0B3D2E; color: #fff; border-radius: 18px; padding: 24px 28px; margin-bottom: 24px; }
  header h1 { margin: 0 0 6px; font-size: 26pt; }
  header p { margin: 0; color: #CFE3DA; }
  h2 { font-size: 15pt; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #F4A259; }
  h3 { font-size: 12pt; margin: 16px 0 6px; color: #0B6E4F; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 6px; border-bottom: 1px solid #E6EBE9; vertical-align: top; }
  .time { width: 60px; font-weight: 700; }
  .tag { width: 110px; color: #52615D; font-size: 10pt; }
  .code { text-align: right; font-weight: 800; letter-spacing: 1px; }
  .right { text-align: right; white-space: nowrap; font-weight: 700; }
  .muted { color: #52615D; font-size: 10.5pt; }
  ul.check { list-style: none; padding: 0; columns: 2; }
  ul.check li { padding: 3px 0; }
  footer { margin-top: 32px; color: #52615D; font-size: 9pt; text-align: center; }
  h2, h3, tr { break-inside: avoid; }
</style></head><body>
<header><h1>${esc(trip.name)}</h1><p>${esc([trip.destinations.join(' · '), formatDateRange(trip.start_date, trip.end_date)].filter(Boolean).join(' · '))}</p></header>
${parts.join('\n')}
<footer>Gerado pelo Tripi</footer>
</body></html>`;
}
