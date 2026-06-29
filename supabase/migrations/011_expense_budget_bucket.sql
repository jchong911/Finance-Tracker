-- User picks need vs want when logging an expenditure

alter table public.transactions
  add column if not exists budget_bucket text
  check (budget_bucket is null or budget_bucket in ('needs', 'wants'));
