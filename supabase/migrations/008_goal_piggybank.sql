-- Piggybank-style goals: monthly auto set-aside + manual contributions

alter table public.savings_goals
  add column monthly_auto_amount numeric(14, 2) not null default 0 check (monthly_auto_amount >= 0);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.savings_goals (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  contributed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index goal_contributions_goal_idx on public.goal_contributions (goal_id);
create index goal_contributions_user_date_idx on public.goal_contributions (user_id, contributed_on desc);

alter table public.goal_contributions enable row level security;

create policy "goal_contrib_select_own" on public.goal_contributions for select using (auth.uid() = user_id);
create policy "goal_contrib_insert_own" on public.goal_contributions for insert with check (auth.uid() = user_id);
create policy "goal_contrib_update_own" on public.goal_contributions for update using (auth.uid() = user_id);
create policy "goal_contrib_delete_own" on public.goal_contributions for delete using (auth.uid() = user_id);

