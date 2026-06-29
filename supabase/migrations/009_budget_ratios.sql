-- Custom budget ratios (user-defined buckets)

create table if not exists public.budget_ratios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  buckets jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists budget_ratios_user_idx on public.budget_ratios (user_id);

alter table public.budget_ratios enable row level security;

create policy "budget_ratios_select_own" on public.budget_ratios
  for select using (auth.uid() = user_id);

create policy "budget_ratios_insert_own" on public.budget_ratios
  for insert with check (auth.uid() = user_id);

create policy "budget_ratios_update_own" on public.budget_ratios
  for update using (auth.uid() = user_id);

create policy "budget_ratios_delete_own" on public.budget_ratios
  for delete using (auth.uid() = user_id);

create or replace function public.set_budget_ratios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists budget_ratios_set_updated_at on public.budget_ratios;
create trigger budget_ratios_set_updated_at
  before update on public.budget_ratios
  for each row execute procedure public.set_budget_ratios_updated_at();

