-- Switch account currency defaults to Philippine peso

alter table public.accounts
  alter column currency set default 'PHP';

update public.accounts
set currency = 'PHP'
where currency = 'USD' or currency is null or currency = '';
