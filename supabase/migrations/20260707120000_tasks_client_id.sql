alter table public.tasks
  add column if not exists client_id uuid references public.clients(id) on delete set null;

