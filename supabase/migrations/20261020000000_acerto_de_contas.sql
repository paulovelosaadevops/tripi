-- Acerto de contas: pagamentos entre viajantes ("Ana pagou € 42 ao Paulo").
-- O saldo de cada um vem dos gastos divididos menos esses pagamentos (cálculo no app).

create table public.trip_settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create index trip_settlements_trip_idx on public.trip_settlements (trip_id);

alter table public.trip_settlements enable row level security;

create policy "membros veem pagamentos" on public.trip_settlements for select using (public.is_trip_member(trip_id));
create policy "editores registram pagamentos" on public.trip_settlements for insert with check (
  public.can_edit_trip(trip_id) and created_by = auth.uid()
);
create policy "editores desfazem pagamentos" on public.trip_settlements for delete using (public.can_edit_trip(trip_id));

alter publication supabase_realtime add table public.trip_settlements;
