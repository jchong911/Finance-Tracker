-- Mark expenses as fixed (rent, subscriptions) vs variable

alter table public.transactions
  add column is_fixed boolean not null default false;

create index transactions_user_fixed_idx on public.transactions (user_id, is_fixed);

