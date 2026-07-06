export function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export function weekdayName(date: Date) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T00:00:00`));
}

export function toInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
