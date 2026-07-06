import type { Message } from '../domain/message';

export type MessagesRepository = {
  list(): Promise<Message[]>;
  create(input: Omit<Message, 'id' | 'time'>): Promise<Message>;
  update(id: string, input: Partial<Omit<Message, 'id'>>): Promise<Message>;
  markConversationAsRead(fromUserId: string, toUserId: string): Promise<void>;
  remove(id: string): Promise<void>;
};
