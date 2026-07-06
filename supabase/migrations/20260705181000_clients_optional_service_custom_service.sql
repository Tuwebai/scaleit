alter table public.clients
  alter column service_id drop not null;

alter table public.clients
  add column if not exists custom_service_name text;
