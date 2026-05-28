-- Allow income/expenses without linking to an account yet

alter table public.transactions
  alter column account_id drop not null;
