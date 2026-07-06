export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: ProfileTable;
      roles: RoleTable;
      permissions: PermissionTable;
      services: ServiceTable;
      clients: ClientTable;
      client_assignments: ClientAssignmentTable;
      finance_income: FinanceIncomeTable;
      finance_expenses: FinanceExpenseTable;
      internal_conversations: InternalConversationTable;
      internal_messages: InternalMessageTable;
      tasks: TaskTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileTable = Table<{
  id: string;
  name: string;
  username: string | null;
  role_id: string | null;
  area: string | null;
  created_at: string;
}>;

type RoleTable = Table<{
  id: string;
  name: string;
  level: number;
  created_at: string;
}>;

type PermissionTable = Table<{
  id: string;
  role_id: string;
  module: string;
  action: string;
  allowed: boolean;
}>;

type ServiceTable = Table<{
  id: string;
  name: string;
  description: string | null;
  value: number;
  value_usd: number | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}>;

type ClientTable = Table<{
  id: string;
  name: string;
  phone: string | null;
  value: number;
  service_id: string | null;
  custom_service_name: string | null;
  color: string | null;
  status: 'Sin empezar' | 'En proceso' | 'Terminado';
  start_date: string;
  delivery_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}>;

type ClientAssignmentTable = Table<{
  id: string;
  client_id: string;
  profile_id: string;
  created_at: string;
}>;

type FinanceIncomeTable = Table<{
  id: string;
  concept: string;
  description: string | null;
  amount: number;
  date: string;
  owner_id: string;
  kind: 'Ingreso' | 'Deposito';
  status: 'Pendiente' | 'Recibido';
  created_at: string;
  updated_at: string;
}>;

type FinanceExpenseTable = Table<{
  id: string;
  concept: string;
  amount: number;
  date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}>;

type TaskTable = Table<{
  id: string;
  category: string;
  concept: string;
  details: string | null;
  completed: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}>;

type InternalMessageTable = Table<{
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  client_id: string | null;
  body: string;
  unread: boolean;
  created_at: string;
}>;

type InternalConversationTable = Table<{
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}>;
