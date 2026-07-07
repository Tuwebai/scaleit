import type { Task } from '../domain/task';

export type TasksRepository = {
  list(): Promise<Task[]>;
  create(input: Omit<Task, 'id'>): Promise<Task>;
  update(id: string, input: Partial<Pick<Task, 'concept' | 'details' | 'completed' | 'clientId'>>): Promise<Task>;
  remove(id: string): Promise<void>;
};
