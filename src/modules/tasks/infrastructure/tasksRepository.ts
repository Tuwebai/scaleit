import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { TasksRepository } from '../application/tasksRepository';
import type { Task } from '../domain/task';

export function createTasksRepository(): TasksRepository {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase no está configurado.');

  return {
    async list() {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapTask);
    },
    async create(input) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          category: input.category,
          concept: input.concept,
          details: input.details,
          completed: input.completed,
          owner_id: input.ownerId,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapTask(data);
    },
    async update(id, input) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ concept: input.concept, details: input.details, completed: input.completed })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapTask(data);
    },
    async remove(id) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function mapTask(row: { id: string; category: string; concept: string; details: string | null; completed: boolean; owner_id: string }): Task {
  return {
    id: row.id,
    category: row.category,
    concept: row.concept,
    details: row.details ?? '',
    completed: row.completed,
    ownerId: row.owner_id,
  };
}
