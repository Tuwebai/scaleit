export type IncomeStatus = 'Pendiente' | 'Recibido';
export type IncomeKind = 'Ingreso' | 'Deposito';

export type Income = {
  id: string;
  concept: string;
  description: string;
  amount: number;
  date: string;
  ownerId: string;
  kind: IncomeKind;
  status: IncomeStatus;
};

export type Expense = {
  id: string;
  concept: string;
  amount: number;
  date: string;
};
