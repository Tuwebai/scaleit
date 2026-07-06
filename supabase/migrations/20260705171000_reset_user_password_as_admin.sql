create extension if not exists pgcrypto;

create or replace function public.reset_user_password_as_admin(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_role text;
begin
  select r.name
  into requester_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();

  if requester_role <> 'Mayor rango' then
    raise exception 'Solo el usuario de mayor rango puede cambiar contraseñas.';
  end if;

  if length(trim(new_password)) < 6 then
    raise exception 'La nueva contraseña debe tener al menos 6 caracteres.';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Usuario no encontrado.';
  end if;
end;
$$;

revoke all on function public.reset_user_password_as_admin(uuid, text) from public;
grant execute on function public.reset_user_password_as_admin(uuid, text) to authenticated;
