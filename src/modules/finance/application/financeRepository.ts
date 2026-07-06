import type { Expense, Income } from '../domain/finance';

export type FinanceRepository = {
  listIncome(): Promise<Income[]>;
  listExpenses(): Promise<Expense[]>;
  createIncome(input: Omit<Income, 'id'>): Promise<Income>;
  createExpense(input: Omit<Expense, 'id'>): Promise<Expense>;
  updateIncome(id: string, input: Partial<Omit<Income, 'id'>>): Promise<Income>;
  updateExpense(id: string, input: Partial<Omit<Expense, 'id'>>): Promise<Expense>;
  removeIncome(id: string): Promise<void>;
  removeExpense(id: string): Promise<void>;
};
