import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { Message } from '../domain/message';
import type { MessagesRepository } from '../application/messagesRepository';

export function createMessagesRepository(): MessagesRepository {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return {
    async list() {
      const { data, error } = await supabase.from('internal_messages').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(mapMessage);
    },
    async create(input) {
      const [userOneId, userTwoId] = [input.from, input.to].sort();
      const { error: conversationError } = await supabase
        .from('internal_conversations')
        .upsert({ user_one_id: userOneId, user_two_id: userTwoId, last_message_at: new Date().toISOString() }, { onConflict: 'user_one_id,user_two_id' });
      if (conversationError) throw conversationError;
      const { data, error } = await supabase
        .from('internal_messages')
        .insert({ from_profile_id: input.from, to_profile_id: input.to, body: input.body, unread: input.unread })
        .select('*')
        .single();
      if (error) throw error;
      return mapMessage(data);
    },
    async update(id, input) {
      const { data, error } = await supabase
        .from('internal_messages')
        .update({ body: input.body, unread: input.unread })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapMessage(data);
    },
    async markConversationAsRead(fromUserId, toUserId) {
      const { error } = await supabase
        .from('internal_messages')
        .update({ unread: false })
        .eq('from_profile_id', fromUserId)
        .eq('to_profile_id', toUserId)
        .eq('unread', true);
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await supabase.from('internal_messages').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function mapMessage(row: { id: string; from_profile_id: string; to_profile_id: string; body: string; unread: boolean; created_at: string }): Message {
  return {
    id: row.id,
    from: row.from_profile_id,
    to: row.to_profile_id,
    body: row.body,
    unread: row.unread,
    createdAt: row.created_at,
    time: new Date(row.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}


