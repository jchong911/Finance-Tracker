-- Savings goals for monthly planning and dashboard chart

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  notes text not null default '',
  target_amount numeric(14, 2) not null check (target_amount > 0),
  created_at timestamptz not null default now()
);

create index savings_goals_user_idx on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;

create policy "savings_goals_select_own" on public.savings_goals for select using (auth.uid() = user_id);
create policy "savings_goals_insert_own" on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "savings_goals_update_own" on public.savings_goals for update using (auth.uid() = user_id);
create policy "savings_goals_delete_own" on public.savings_goals for delete using (auth.uid() = user_id);
