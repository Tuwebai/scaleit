import type { Role, User } from '../domain/user';

export type UsersRepository = {
  list(): Promise<User[]>;
  listRoles(): Promise<Role[]>;
  createRole(name: string): Promise<Role>;
  create(input: Omit<User, 'id'>): Promise<User>;
  update(id: string, input: Partial<Pick<User, 'name' | 'username' | 'password' | 'role' | 'area'>>): Promise<User>;
};
