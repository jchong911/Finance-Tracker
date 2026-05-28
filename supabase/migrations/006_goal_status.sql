-- Add status to savings goals so achieved/diverted goals can be hidden from dashboard

create type public.goal_status as enum ('active', 'achieved', 'diverted');

alter table public.savings_goals
  add column status public.goal_status not null default 'active';

create index savings_goals_user_status_idx on public.savings_goals (user_id, status);
