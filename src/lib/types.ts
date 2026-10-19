/** Linhas das tabelas do Supabase (ver supabase/migrations). Datas vêm como string ISO. */

export type TripType = 'lazer' | 'trabalho' | 'familia' | 'mochilao';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export type Trip = {
  id: string;
  owner_id: string;
  name: string;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  local_currency: string;
  budget: number | null;
  trip_type: TripType;
  invite_code: string;
  invite_link_enabled: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TripMember = {
  trip_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profiles: { id: string; name: string } | null;
};

export type ActivityCategory = 'passeio' | 'refeicao' | 'transporte' | 'hospedagem' | 'outro';

export type Activity = {
  id: string;
  trip_id: string;
  day: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  category: ActivityCategory;
  place: string | null;
  estimated_cost: number | null;
  notes: string | null;
  reservation_id: string | null;
  created_by: string;
  created_at: string;
};

export type ReservationKind = 'voo' | 'hospedagem' | 'transporte' | 'carro' | 'ingresso' | 'outro';

export type Reservation = {
  id: string;
  trip_id: string;
  kind: ReservationKind;
  title: string;
  code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  place: string | null;
  amount: number | null;
  currency: string | null;
  details: Record<string, unknown>;
  created_by: string;
  created_at: string;
};

export type ExpenseCategory = 'alimentacao' | 'transporte' | 'hospedagem' | 'ingressos' | 'compras' | 'outros';

export type Expense = {
  id: string;
  trip_id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  spent_on: string;
  paid_by: string;
  split_equally: boolean;
  receipt_path: string | null;
  reservation_id: string | null;
  created_by: string;
  created_at: string;
};

/** Pagamento entre viajantes no acerto de contas. */
export type TripSettlement = {
  id: string;
  trip_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  created_by: string;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  trip_id: string;
  group_name: string;
  label: string;
  done: boolean;
  position: number;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  home_currency: string;
};

export type Contact = {
  id: string;
  trip_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  trip_id: string;
  title: string;
  body: string;
  tag: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentKind = 'passaporte' | 'seguro' | 'voucher' | 'visto' | 'vacina' | 'outro';
export type DocumentVisibility = 'pessoal' | 'viagem';

export type TripDocument = {
  id: string;
  trip_id: string;
  owner_id: string;
  kind: DocumentKind;
  name: string;
  expires_on: string | null;
  visibility: DocumentVisibility;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
};
