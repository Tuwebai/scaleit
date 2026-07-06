import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { Service } from '../domain/service';
import type { ServicesRepository } from '../application/servicesRepository';

export function createServicesRepository(): ServicesRepository {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return {
    async list() {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapService);
    },
    async create(input) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('Sesión requerida.');
      const { data, error } = await supabase
        .from('services')
        .insert({ name: input.name, description: input.description, value: input.value, value_usd: input.valueUsd, active: input.active, created_by: userData.user.id })
        .select('*')
        .single();
      if (error) throw error;
      return mapService(data);
    },
    async update(id, input) {
      const { data, error } = await supabase
        .from('services')
        .update({ name: input.name, description: input.description, value: input.value, value_usd: input.valueUsd, active: input.active })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapService(data);
    },
    async remove(id) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function mapService(row: {
  id: string;
  name: string;
  description: string | null;
  value: number;
  value_usd: number | null;
  active: boolean;
}): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    value: row.value,
    valueUsd: row.value_usd,
    active: row.active,
  };
}

