const LOCALE = 'pt-BR';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "2026-11-12" → Date local (sem fuso). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** "12/11/2026" → "2026-11-12"; null se inválida. */
export function parseBrazilianDate(input: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toISODate(date);
}

export function formatBrazilianDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = parseISODate(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Máscara enquanto digita: "12112026" → "12/11/2026". */
export function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Máscara de horário: "930" → "09:30" ao completar. */
export function maskTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return Boolean(match && Number(match[1]) < 24 && Number(match[2]) < 60);
}

/** "12 nov" */
export function formatDayMonth(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "qui, 12 nov" */
export function formatWeekdayDayMonth(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS[parseISODate(iso).getDay()];
}

/** "12 – 22 nov 2026", "28 nov – 3 dez 2026" ou "Datas a definir". */
export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Datas a definir';
  const s = parseISODate(start);
  if (!end) return `a partir de ${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  const e = parseISODate(end);
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }
  if (s.getMonth() !== e.getMonth()) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

export function formatMonthYear(iso: string): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Dias inteiros entre hoje e a data (negativo se já passou). */
export function daysUntil(iso: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseISODate(iso).getTime() - start.getTime()) / 86_400_000);
}

/** Lista de datas ISO de `start` a `end`, inclusive. */
export function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = parseISODate(start);
  const last = parseISODate(end);
  while (cursor <= last && days.length < 366) {
    days.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatMoney(value: number | null | undefined, currency: string, options?: { cents?: boolean }) {
  const cents = options?.cents ?? !Number.isInteger(value ?? 0);
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    }).format(value ?? 0);
  } catch {
    return `${currency} ${(value ?? 0).toFixed(cents ? 2 : 0)}`;
  }
}

/** "1.234,56" ou "1234.56" → 1234.56; null se vazio/inválido. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** "09:30:00" → "09:30" */
export function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/** Número para preencher um campo de valor: 48.5 → "48,50"; 320 → "320". */
export function moneyInput(value: number | null | undefined): string {
  if (value == null) return '';
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
}
