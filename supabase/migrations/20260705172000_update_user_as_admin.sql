create extension if not exists pgcrypto;

create or replace function public.update_user_as_admin(
  target_user_id uuid,
  user_name text default null,
  user_username text default null,
  user_role text default null,
  user_area text default null,
  new_password text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_role text;
  target_role_id uuid;
begin
  select r.name
  into requester_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();

  if requester_role <> 'Mayor rango' then
    raise exception 'Solo el usuario de mayor rango puede editar usuarios.';
  end if;

  if user_role is not null then
    select id
    into target_role_id
    from public.roles
    where name = user_role;

    if target_role_id is null then
      raise exception 'Rol no encontrado.';
    end if;
  end if;

  update public.profiles
  set name = coalesce(nullif(trim(user_name), ''), name),
      username = coalesce(nullif(trim(user_username), ''), username),
      role_id = coalesce(target_role_id, role_id),
      area = coalesce(user_area, area)
  where id = target_user_id;

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
    where id = target_user_id;
  end if;
end;
$$;

revoke all on function public.update_user_as_admin(uuid, text, text, text, text, text) from public;
grant execute on function public.update_user_as_admin(uuid, text, text, text, text, text) to authenticated;
