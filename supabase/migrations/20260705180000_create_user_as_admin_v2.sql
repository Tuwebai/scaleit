create or replace function public.create_user_as_admin_v2(
  user_login text,
  user_password text,
  user_name text,
  user_role text,
  user_area text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  clean_login text;
  auth_email text;
  created_user_id uuid;
  result jsonb;
begin
  clean_login := lower(trim(user_login));

  if clean_login = '' then
    raise exception 'Ingresá un usuario o email.';
  end if;

  if length(trim(user_password)) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.';
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = clean_login
  ) then
    raise exception 'Ya existe un usuario con ese login.';
  end if;

  auth_email := case
    when clean_login like '%@%' then clean_login
    else clean_login || '@scaleit.local'
  end;

  created_user_id := public.create_user_as_admin(
    auth_email,
    user_password,
    user_name,
    user_role,
    user_area
  );

  update public.profiles
  set username = clean_login
  where id = created_user_id;

  select jsonb_build_object(
    'id', p.id::text,
    'name', p.name::text,
    'username', p.username::text,
    'area', p.area::text,
    'role', r.name::text
  )
  into result
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = created_user_id;

  return result;
end;
$$;

revoke all on function public.create_user_as_admin_v2(text, text, text, text, text) from public;
grant execute on function public.create_user_as_admin_v2(text, text, text, text, text) to authenticated;
notify pgrst, 'reload schema';
