-- Map expense categories to custom ratio buckets

alter table public.budget_ratios
  add column if not exists category_bucket_map jsonb not null default '{}'::jsonb;

