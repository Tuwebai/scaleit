create extension if not exists pgcrypto with schema extensions;

create or replace function public.update_user_as_admin_v4(
  target_user_id uuid,
  user_name text default null,
  user_username text default null,
  user_role text default null,
  user_area text default null,
  new_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  requester_role text;
  target_role_id uuid;
  result jsonb;
begin
  select r.name::text
  into requester_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();

  if requester_role <> 'Mayor rango' then
    raise exception 'Solo el usuario de mayor rango puede editar usuarios.';
  end if;

  if user_role is not null then
    select roles.id
    into target_role_id
    from public.roles
    where roles.name = user_role;

    if target_role_id is null then
      raise exception 'Rol no encontrado.';
    end if;
  end if;

  update public.profiles
  set name = coalesce(nullif(trim(user_name), ''), profiles.name),
      username = coalesce(nullif(trim(user_username), ''), profiles.username),
      role_id = coalesce(target_role_id, profiles.role_id),
      area = coalesce(user_area, profiles.area)
  where profiles.id = target_user_id;

  if not found then
    raise exception 'Usuario no encontrado.';
  end if;

  if new_password is not null and trim(new_password) <> '' then
    if length(trim(new_password)) < 6 then
      raise exception 'La nueva contraseña debe tener al menos 6 caracteres.';
    end if;

    update auth.users
    set encrypted_password = crypt(trim(new_password), gen_salt('bf')),
        updated_at = now()
    where auth.users.id = target_user_id;
  end if;

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
  where p.id = target_user_id;

  return result;
end;
$$;

revoke all on function public.update_user_as_admin_v4(uuid, text, text, text, text, text) from public;
grant execute on function public.update_user_as_admin_v4(uuid, text, text, text, text, text) to authenticated;
notify pgrst, 'reload schema';
