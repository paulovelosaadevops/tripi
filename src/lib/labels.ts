import type { Palette, Tint } from '@/theme/tokens';
import type { ActivityCategory, DocumentKind, ExpenseCategory, ReservationKind, TripType } from '@/lib/types';

export const TripTypeLabels: Record<TripType, string> = {
  lazer: 'Lazer',
  trabalho: 'Trabalho',
  familia: 'Família',
  mochilao: 'Mochilão',
};

export const ActivityCategoryLabels: Record<ActivityCategory, string> = {
  passeio: 'Passeio',
  refeicao: 'Refeição',
  transporte: 'Transporte',
  hospedagem: 'Hospedagem',
  outro: 'Outro',
};

export function activityTint(colors: Palette, category: ActivityCategory): Tint {
  switch (category) {
    case 'passeio':
      return colors.green;
    case 'refeicao':
      return colors.orange;
    case 'transporte':
      return colors.blue;
    case 'hospedagem':
      return colors.purple;
    default:
      return { bg: colors.track, fg: colors.label };
  }
}

export const ReservationKindLabels: Record<ReservationKind, string> = {
  voo: 'Voo',
  hospedagem: 'Hospedagem',
  transporte: 'Trem/ônibus',
  carro: 'Carro',
  ingresso: 'Ingresso',
  outro: 'Outro',
};

export function reservationTint(colors: Palette, kind: ReservationKind): Tint {
  switch (kind) {
    case 'voo':
      return colors.blue;
    case 'hospedagem':
      return colors.purple;
    case 'transporte':
    case 'carro':
      return colors.orange;
    case 'ingresso':
      return colors.green;
    default:
      return { bg: colors.track, fg: colors.label };
  }
}

/** Rótulos dos campos do formulário de reserva conforme o tipo. */
export const ReservationFieldLabels: Record<
  ReservationKind,
  { name: string; namePlaceholder: string; start: string; end: string; place: string; placePlaceholder: string }
> = {
  voo: { name: 'Companhia e número do voo', namePlaceholder: 'Ex.: Voo 0082', start: 'Partida', end: 'Chegada', place: 'Origem → destino', placePlaceholder: 'Ex.: GRU → LIS' },
  hospedagem: { name: 'Nome da hospedagem', namePlaceholder: 'Ex.: Hotel na Ribeira', start: 'Check-in', end: 'Check-out', place: 'Endereço', placePlaceholder: 'Rua, número, cidade' },
  transporte: { name: 'Empresa e linha', namePlaceholder: 'Ex.: Trem Lisboa → Porto', start: 'Partida', end: 'Chegada', place: 'Estação de embarque', placePlaceholder: 'Nome da estação' },
  carro: { name: 'Locadora', namePlaceholder: 'Nome da locadora', start: 'Retirada', end: 'Devolução', place: 'Local de retirada', placePlaceholder: 'Ex.: aeroporto' },
  ingresso: { name: 'Atração ou evento', namePlaceholder: 'Ex.: Palácio da Pena', start: 'Início', end: 'Fim (opcional)', place: 'Local', placePlaceholder: 'Endereço ou nome do lugar' },
  outro: { name: 'Descrição', namePlaceholder: 'O que foi reservado', start: 'Início', end: 'Fim', place: 'Local', placePlaceholder: 'Opcional' },
};

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  hospedagem: 'Hospedagem',
  ingressos: 'Ingressos',
  compras: 'Compras',
  outros: 'Outros',
};

export const Currencies = [
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'Dólar' },
  { code: 'BRL', label: 'Real' },
  { code: 'GBP', label: 'Libra' },
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'CLP', label: 'Peso chileno' },
] as const;

/** Checklist sugerido ao criar a viagem. */
export const DefaultChecklist: { group: string; items: string[] }[] = [
  { group: 'Documentos', items: ['Passaporte', 'Seguro viagem', 'Cópias digitais dos documentos'] },
  { group: 'Antes de sair', items: ['Avisar o banco sobre a viagem', 'Contratar eSIM ou chip', 'Comprar moeda local'] },
  { group: 'Eletrônicos', items: ['Adaptador de tomada', 'Carregadores e power bank'] },
  { group: 'Roupas', items: ['Roupas para o clima do destino', 'Tênis confortável'] },
];

export const DocumentKindLabels: Record<DocumentKind, string> = {
  passaporte: 'Passaporte',
  seguro: 'Seguro',
  voucher: 'Voucher',
  visto: 'Visto',
  vacina: 'Vacina',
  outro: 'Outro',
};

export const RoleLabels = { owner: 'Organizador', editor: 'Pode editar', viewer: 'Só visualiza' } as const;
