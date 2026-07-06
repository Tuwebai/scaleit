import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { Client } from '../domain/client';
import type { ClientsRepository } from '../application/clientsRepository';

export function createClientsRepository(): ClientsRepository {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return {
    async list() {
      const { data, error } = await supabase
        .from('clients')
        .select('*, client_assignments(profile_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapClient);
    },
    async create(input) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('Sesión requerida.');
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: input.name,
          phone: input.phone,
          value: input.value,
          service_id: input.serviceId || null,
          custom_service_name: input.customServiceName || null,
          color: input.color || '#f97316',
          status: input.status,
          start_date: input.start,
          delivery_date: input.delivery,
          notes: input.notes,
          created_by: userData.user.id,
        })
        .select('*')
        .single();
      if (error) throw error;
      if (input.assignedTo.length > 0) {
        const { error: assignmentError } = await supabase
          .from('client_assignments')
          .insert(input.assignedTo.map((profileId) => ({ client_id: data.id, profile_id: profileId })));
        if (assignmentError) throw assignmentError;
      }
      return { ...mapClient(data), assignedTo: input.assignedTo };
    },
    async update(id, input) {
      const updateData = {
        name: input.name,
        phone: input.phone,
        value: input.value,
        service_id: input.serviceId === undefined ? undefined : input.serviceId || null,
        custom_service_name: input.customServiceName === undefined ? undefined : input.customServiceName || null,
        color: input.color,
        status: input.status,
        start_date: input.start,
        delivery_date: input.delivery,
        notes: input.notes,
      };
      const { data, error } = await supabase
        .from('clients')
        .update(Object.fromEntries(Object.entries(updateData).filter(([, value]) => value !== undefined)) as never)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      if (input.assignedTo) {
        const { error: deleteError } = await supabase.from('client_assignments').delete().eq('client_id', id);
        if (deleteError) throw deleteError;
        if (input.assignedTo.length > 0) {
          const { error: insertError } = await supabase
            .from('client_assignments')
            .insert(input.assignedTo.map((profileId) => ({ client_id: id, profile_id: profileId })));
          if (insertError) throw insertError;
        }
      }
      return { ...mapClient(data), assignedTo: input.assignedTo ?? mapClient(data).assignedTo };
    },
    async remove(id) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function mapClient(row: {
  id: string;
  name: string;
  phone: string | null;
  value: number;
  service_id: string | null;
  custom_service_name: string | null;
  color: string | null;
  status: Client['status'];
  start_date: string;
  delivery_date: string;
  notes: string | null;
  client_assignments?: { profile_id: string }[] | null;
}): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    value: row.value,
    serviceId: row.service_id ?? '',
    customServiceName: row.custom_service_name ?? '',
    color: row.color ?? '#f97316',
    status: row.status,
    start: row.start_date,
    delivery: row.delivery_date,
    assignedTo: row.client_assignments?.map((assignment) => assignment.profile_id) ?? [],
    notes: row.notes ?? '',
  };
}
