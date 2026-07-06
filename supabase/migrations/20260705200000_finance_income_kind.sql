alter table public.finance_income
  add column if not exists kind text not null default 'Deposito'
  check (kind in ('Ingreso', 'Deposito'));

