export type Role = string;

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  area: string;
};
