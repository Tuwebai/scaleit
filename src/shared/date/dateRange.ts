import { toInputDate } from './dateFormatters';

type FinanceFilter = {
  type: 'week' | 'month' | 'custom';
  from: string;
  to: string;
};

export function dayFromDate(date: string) {
  const day = Number(date.slice(8, 10));
  return Math.max(1, day);
}

export function monthFromDate(date: string) {
  return date.slice(0, 7);
}

export function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function shiftMonth(monthValue: string, offset: number) {
  const [year, month] = monthValue.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getFinanceRange(filter: FinanceFilter) {
  const today = new Date();
  if (filter.type === 'custom') return { from: filter.from, to: filter.to };
  if (filter.type === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - mondayIndex(today));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: toInputDate(from), to: toInputDate(to) };
}

export function isDateInRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}
