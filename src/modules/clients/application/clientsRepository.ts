import type { Client } from '../domain/client';

export type ClientsRepository = {
  list(): Promise<Client[]>;
  create(input: Omit<Client, 'id'>): Promise<Client>;
  update(id: string, input: Partial<Omit<Client, 'id'>>): Promise<Client>;
  remove(id: string): Promise<void>;
};
