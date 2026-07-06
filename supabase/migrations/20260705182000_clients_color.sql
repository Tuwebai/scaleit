alter table public.clients
  add column if not exists color text default '#f97316';

update public.clients
set color = '#f97316'
where color is null;
