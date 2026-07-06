import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';
import type { Expense, Income } from '../domain/finance';
import type { FinanceRepository } from '../application/financeRepository';

export function createFinanceRepository(): FinanceRepository {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return {
    async listIncome() {
      const { data, error } = await supabase.from('finance_income').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapIncome);
    },
    async listExpenses() {
      const { data, error } = await supabase.from('finance_expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapExpense);
    },
    async createIncome(input) {
      const { data, error } = await supabase
        .from('finance_income')
        .insert({ concept: input.concept, description: input.description, amount: input.amount, date: input.date, owner_id: input.ownerId, kind: input.kind, status: input.status })
        .select('*')
        .single();
      if (error) throw error;
      return mapIncome(data);
    },
    async createExpense(input) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('Sesión requerida.');
      const { data, error } = await supabase
        .from('finance_expenses')
        .insert({ concept: input.concept, amount: input.amount, date: input.date, created_by: userData.user.id })
        .select('*')
        .single();
      if (error) throw error;
      return mapExpense(data);
    },
    async updateIncome(id, input) {
      const { data, error } = await supabase
        .from('finance_income')
        .update({ concept: input.concept, description: input.description, amount: input.amount, date: input.date, owner_id: input.ownerId, kind: input.kind, status: input.status })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapIncome(data);
    },
    async updateExpense(id, input) {
      const { data, error } = await supabase
        .from('finance_expenses')
        .update({ concept: input.concept, amount: input.amount, date: input.date })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapExpense(data);
    },
    async removeIncome(id) {
      const { error } = await supabase.from('finance_income').delete().eq('id', id);
      if (error) throw error;
    },
    async removeExpense(id) {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function mapIncome(row: { id: string; concept: string; description: string | null; amount: number; date: string; owner_id: string; kind?: Income['kind'] | null; status: Income['status'] }): Income {
  return {
    id: row.id,
    concept: row.concept,
    description: row.description ?? '',
    amount: row.amount,
    date: row.date,
    ownerId: row.owner_id,
    kind: row.kind ?? 'Deposito',
    status: row.status,
  };
}

function mapExpense(row: { id: string; concept: string; amount: number; date: string }): Expense {
  return {
    id: row.id,
    concept: row.concept,
    amount: row.amount,
    date: row.date,
  };
}
