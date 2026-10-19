-- Tripi · esquema inicial
-- Rode no SQL Editor do Supabase (ou `supabase db push`).
-- Toda tabela tem RLS: só membros da viagem leem; só editores e o dono alteram.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Perfis
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  home_currency text not null default 'BRL',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Viagens e membros
-- ─────────────────────────────────────────────────────────────
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  destinations text[] not null default '{}',
  start_date date,
  end_date date,
  local_currency text not null default 'EUR',
  budget numeric(12, 2),
  trip_type text not null default 'lazer' check (trip_type in ('lazer', 'trabalho', 'familia', 'mochilao')),
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  invite_link_enabled boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  email text not null,
  invited_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (trip_id, email)
);

-- Funções auxiliares para as políticas (security definer evita recursão no RLS).
create function public.is_trip_member(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = p_trip and user_id = auth.uid());
$$;

create function public.can_edit_trip(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_members
    where trip_id = p_trip and user_id = auth.uid() and role in ('owner', 'editor')
  );
$$;

create function public.is_trip_owner(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_members where trip_id = p_trip and user_id = auth.uid() and role = 'owner'
  );
$$;

-- O criador vira dono automaticamente.
create function public.add_trip_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into trip_members (trip_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.add_trip_owner();

-- Entrar numa viagem pelo código do link de convite.
create function public.join_trip(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_trip uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into v_trip from trips where invite_code = p_code and invite_link_enabled;
  if v_trip is null then
    raise exception 'invite not found';
  end if;
  insert into trip_members (trip_id, user_id, role)
  values (v_trip, auth.uid(), 'editor')
  on conflict do nothing;
  update trip_invites set accepted_at = now()
  where trip_id = v_trip and lower(email) = lower(auth.jwt() ->> 'email') and accepted_at is null;
  return v_trip;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Conteúdo da viagem
-- ─────────────────────────────────────────────────────────────
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  kind text not null check (kind in ('voo', 'hospedagem', 'transporte', 'carro', 'ingresso', 'outro')),
  title text not null,
  code text,
  starts_at timestamptz,
  ends_at timestamptz,
  place text,
  amount numeric(12, 2),
  currency text,
  details jsonb not null default '{}',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day date not null,
  start_time time,
  end_time time,
  title text not null,
  category text not null default 'passeio' check (category in ('passeio', 'refeicao', 'transporte', 'hospedagem', 'outro')),
  place text,
  estimated_cost numeric(12, 2),
  notes text,
  reservation_id uuid references public.reservations (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  description text not null,
  category text not null check (category in ('alimentacao', 'transporte', 'hospedagem', 'ingressos', 'compras', 'outros')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null,
  spent_on date not null default current_date,
  paid_by uuid not null default auth.uid() references public.profiles (id),
  split_equally boolean not null default true,
  receipt_path text,
  reservation_id uuid references public.reservations (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.expense_settlements (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  settled_at timestamptz not null default now(),
  primary key (expense_id, user_id)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  group_name text not null default 'Geral',
  label text not null,
  done boolean not null default false,
  position int not null default 0,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id),
  kind text not null default 'outro' check (kind in ('passaporte', 'seguro', 'voucher', 'visto', 'vacina', 'outro')),
  name text not null,
  expires_on date,
  visibility text not null default 'viagem' check (visibility in ('pessoal', 'viagem')),
  storage_path text not null,
  mime_type text,
  reservation_id uuid references public.reservations (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  tag text,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.trip_members (user_id);
create index on public.activities (trip_id, day, start_time);
create index on public.reservations (trip_id, starts_at);
create index on public.expenses (trip_id, spent_on);
create index on public.checklist_items (trip_id, position);
create index on public.documents (trip_id);

-- updated_at automático
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_trips before update on public.trips for each row execute function public.touch_updated_at();
create trigger touch_activities before update on public.activities for each row execute function public.touch_updated_at();
create trigger touch_reservations before update on public.reservations for each row execute function public.touch_updated_at();
create trigger touch_notes before update on public.notes for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;
alter table public.reservations enable row level security;
alter table public.activities enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_settlements enable row level security;
alter table public.checklist_items enable row level security;
alter table public.documents enable row level security;
alter table public.contacts enable row level security;
alter table public.notes enable row level security;

-- Perfis: você vê o seu e o de quem viaja com você.
create policy "perfil próprio ou colega" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from trip_members a join trip_members b on a.trip_id = b.trip_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);
create policy "editar o próprio perfil" on public.profiles for update using (id = auth.uid());

-- Viagens
create policy "membros veem a viagem" on public.trips for select using (public.is_trip_member(id) or owner_id = auth.uid());
create policy "criar viagem" on public.trips for insert with check (owner_id = auth.uid());
create policy "editores alteram a viagem" on public.trips for update using (public.can_edit_trip(id));
create policy "dono exclui a viagem" on public.trips for delete using (public.is_trip_owner(id));

-- Membros
create policy "membros veem membros" on public.trip_members for select using (public.is_trip_member(trip_id));
create policy "dono altera papéis" on public.trip_members for update using (public.is_trip_owner(trip_id));
create policy "sair ou remover" on public.trip_members for delete using (user_id = auth.uid() or public.is_trip_owner(trip_id));

-- Convites
create policy "membros veem convites" on public.trip_invites for select using (public.is_trip_member(trip_id));
create policy "editores convidam" on public.trip_invites for insert with check (public.can_edit_trip(trip_id));
create policy "editores cancelam convites" on public.trip_invites for delete using (public.can_edit_trip(trip_id));

-- Tabelas de conteúdo: leitura para membros, escrita para editores.
do $$
declare
  t text;
begin
  foreach t in array array['reservations', 'activities', 'expenses', 'checklist_items', 'contacts', 'notes'] loop
    execute format('create policy "membros leem" on public.%I for select using (public.is_trip_member(trip_id))', t);
    execute format('create policy "editores criam" on public.%I for insert with check (public.can_edit_trip(trip_id))', t);
    execute format('create policy "editores alteram" on public.%I for update using (public.can_edit_trip(trip_id))', t);
    execute format('create policy "editores excluem" on public.%I for delete using (public.can_edit_trip(trip_id))', t);
  end loop;
end;
$$;

-- Acertos de gastos
create policy "membros veem acertos" on public.expense_settlements for select using (
  exists (select 1 from expenses e where e.id = expense_id and public.is_trip_member(e.trip_id))
);
create policy "editores marcam acertos" on public.expense_settlements for insert with check (
  exists (select 1 from expenses e where e.id = expense_id and public.can_edit_trip(e.trip_id))
);
create policy "editores desfazem acertos" on public.expense_settlements for delete using (
  exists (select 1 from expenses e where e.id = expense_id and public.can_edit_trip(e.trip_id))
);

-- Documentos: "pessoal" só o dono vê; "viagem" todos os membros.
create policy "ver documentos" on public.documents for select using (
  public.is_trip_member(trip_id) and (visibility = 'viagem' or owner_id = auth.uid())
);
create policy "adicionar documentos" on public.documents for insert with check (
  public.is_trip_member(trip_id) and owner_id = auth.uid()
);
create policy "alterar os próprios documentos" on public.documents for update using (owner_id = auth.uid());
create policy "excluir os próprios documentos" on public.documents for delete using (
  owner_id = auth.uid() or public.is_trip_owner(trip_id)
);

-- ─────────────────────────────────────────────────────────────
-- Storage: arquivos em documents/<trip_id>/<arquivo>
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "membros leem arquivos da viagem" on storage.objects for select using (
  bucket_id = 'documents' and public.is_trip_member(((storage.foldername(name))[1])::uuid)
);
create policy "membros enviam arquivos" on storage.objects for insert with check (
  bucket_id = 'documents' and public.is_trip_member(((storage.foldername(name))[1])::uuid)
);
create policy "dono do arquivo exclui" on storage.objects for delete using (
  bucket_id = 'documents' and owner = auth.uid()
);

-- ─────────────────────────────────────────────────────────────
-- Realtime: mudanças chegam na hora para todos os viajantes
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table
  public.trips, public.trip_members, public.reservations, public.activities,
  public.expenses, public.expense_settlements, public.checklist_items, public.notes;
