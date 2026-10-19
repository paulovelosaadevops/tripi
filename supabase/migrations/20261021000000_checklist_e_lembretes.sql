-- Checklist com mais detalhes + lembretes por notificação (Web Push).

-- ── Checklist: observações, quantidade e quem leva ─────────────────
alter table public.checklist_items
  add column notes text,
  add column quantity int not null default 1 check (quantity between 1 and 999),
  add column assigned_to uuid references public.profiles (id) on delete set null;

-- ── Fuso horário do destino ──────────────────────────────────────
-- Os horários das reservas e atividades são "hora local do destino"; para avisar na hora certa,
-- o servidor precisa saber o fuso (o app preenche a partir da cidade, ex.: "Europe/Lisbon").
alter table public.trips add column timezone text;

-- ── Aparelhos que recebem notificações ──────────────────────────────
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  -- Fuso do aparelho: usado quando a viagem ainda não tem fuso.
  timezone text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "cada um vê os próprios aparelhos" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "cada um registra os próprios aparelhos" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "cada um atualiza os próprios aparelhos" on public.push_subscriptions for update using (user_id = auth.uid());
create policy "cada um remove os próprios aparelhos" on public.push_subscriptions for delete using (user_id = auth.uid());

-- ── Preferências de lembrete (por pessoa e por viagem) ───────────────
create table public.reminder_settings (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  enabled boolean not null default true,
  -- Antecedência em minutos.
  flight_minutes int not null default 180 check (flight_minutes between 15 and 1440),
  activity_minutes int not null default 60 check (activity_minutes between 5 and 1440),
  -- Check-out, devolução do carro e outros fins de reserva.
  checkout_minutes int not null default 60 check (checkout_minutes between 5 and 1440),
  updated_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);
alter table public.reminder_settings enable row level security;
create policy "ver as próprias preferências" on public.reminder_settings for select using (user_id = auth.uid());
create policy "criar as próprias preferências" on public.reminder_settings for insert with check (
  user_id = auth.uid() and public.is_trip_member(trip_id)
);
create policy "alterar as próprias preferências" on public.reminder_settings for update using (user_id = auth.uid());
create policy "remover as próprias preferências" on public.reminder_settings for delete using (user_id = auth.uid());

-- ── Lembretes já enviados (para não repetir) ───────────────────────
-- Só a função do servidor (chave de serviço) lê e grava aqui; o app não tem acesso.
create table public.reminder_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, event_key)
);
alter table public.reminder_log enable row level security;
