import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { Role, User } from '../domain/user';
import type { UsersRepository } from '../application/usersRepository';

export function createUsersRepository(): UsersRepository {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return {
    async list() {
      const { data, error } = await supabase.from('profiles').select('*, roles(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapUser);
    },
    async listRoles() {
      const { data, error } = await supabase.from('roles').select('name').order('level', { ascending: false });
      if (error) throw error;
      return data.map((role) => role.name);
    },
    async createRole(name) {
      const { data, error } = await supabase.from('roles').insert({ name, level: 10 }).select('name').single();
      if (error) throw error;
      return data.name;
    },
    async create(input) {
      const { data, error: createError } = await (supabase as any).rpc('create_user_as_admin_v2', {
        user_login: input.username,
        user_password: input.password,
        user_name: input.name,
        user_role: input.role,
        user_area: input.area,
      });
      if (createError) throw createError;
      return mapUserUpdate(data);
    },
    async update(id, input) {
      const { data, error: updateError } = await (supabase as any).rpc('update_user_as_admin_v4', {
        target_user_id: id,
        user_name: input.name ?? null,
        user_username: input.username ?? null,
        user_role: input.role ?? null,
        user_area: input.area ?? null,
        new_password: input.password?.trim() || null,
      });
      if (updateError) throw updateError;
      return mapUserUpdate(data);
    },
  };
}

function mapUser(row: {
  id: string;
  name: string;
  username: string | null;
  area: string | null;
  roles?: { name: string } | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    password: '',
    role: row.roles?.name ?? 'Operativo',
    area: row.area ?? '',
  };
}

function mapUserUpdate(row: { id: string; name: string; username: string | null; area: string | null; role: string | null }): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    password: '',
    role: row.role ?? 'Operativo',
    area: row.area ?? '',
  };
}
