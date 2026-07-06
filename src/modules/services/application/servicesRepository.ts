import type { Service } from '../domain/service';

export type ServicesRepository = {
  list(): Promise<Service[]>;
  create(input: Omit<Service, 'id'>): Promise<Service>;
  update(id: string, input: Partial<Omit<Service, 'id'>>): Promise<Service>;
  remove(id: string): Promise<void>;
};
