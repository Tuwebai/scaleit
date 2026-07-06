import { useMemo, useState, type CSSProperties } from 'react';
import type { Client } from '../../modules/clients/domain/client';
import { statusClass } from '../../modules/clients/domain/clientStatus';
import type { Expense, Income } from '../../modules/finance/domain/finance';
import type { Section } from '../../modules/shell/domain/section';
import { mondayIndex, monthFromDate } from '../date/dateRange';
import { formatDate, monthTitle, weekdayName } from '../date/dateFormatters';
import { money } from '../formatters/money';
import { EmptyState } from './EmptyState';

export function titleFor(section: Section) {
  const titles: Record<Section, string> = {
    clientes: 'Clientes',
    tareas: 'Tareas',
    servicios: 'Servicios',
    calendario: 'Calendario',
    finanzas: 'Finanzas',
    mensajes: 'Mensajes internos',
    usuarios: 'Usuarios y roles',
  };
  return titles[section];
}

export function Metric({ title, value, tone }: { title: string; value: string; tone: 'orange' | 'soft' | 'white' | 'dark' }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function Access({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <div className="access-item">
      <span>{label}</span>
      <i className={allowed ? 'dot on' : 'dot off'} />
    </div>
  );
}

export function ClientRow({ client, service, users }: { client: Client; service: string; users: string[] }) {
  return (
    <article className="client-row">
      <div>
        <strong>{client.name}</strong>
        <span>{service} · {users.join(', ')}</span>
      </div>
      <em className={`status ${statusClass(client.status)}`}>{client.status}</em>
    </article>
  );
}

export function ClientCard({ client, service, users }: { client: Client; service: string; users: string[] }) {
  return (
    <article className="card client-card">
      <div className="client-head">
        <div>
          <h3>{client.name}</h3>
          <p>{service}</p>
        </div>
        <em className={`status ${statusClass(client.status)}`}>{client.status}</em>
      </div>
      <div className="detail-grid">
        <span><strong>Telefono</strong>{client.phone}</span>
        <span><strong>Valor</strong>{money.format(client.value)}</span>
        <span><strong>Inicio</strong>{formatDate(client.start)}</span>
        <span><strong>Entrega</strong>{formatDate(client.delivery)}</span>
      </div>
      <p className="notes">{client.notes}</p>
      <div className="assigned">{users.join(', ')}</div>
    </article>
  );
}

export function FinanceCharts({ income, expenses, isAdmin }: { income: Income[]; expenses: Expense[]; isAdmin: boolean }) {
  const received = income.filter((item) => item.status === 'Recibido');
  const pending = income.filter((item) => item.status === 'Pendiente');
  const receivedTotal = received.reduce((acc, item) => acc + item.amount, 0);
  const pendingTotal = pending.reduce((acc, item) => acc + item.amount, 0);
  const expenseTotal = expenses.reduce((acc, item) => acc + item.amount, 0);
  const max = Math.max(receivedTotal, pendingTotal, expenseTotal, 1);

  return (
    <section className="finance-charts">
      <article className="card chart-card">
        <div className="card-title">
          <div>
            <h3>Resumen visual</h3>
            <span>{isAdmin ? 'Periodo seleccionado' : 'Mis movimientos'}</span>
          </div>
        </div>
        <div className="bar-chart">
          <ChartBar label="Recibido" value={receivedTotal} max={max} />
          <ChartBar label="Pendiente" value={pendingTotal} max={max} />
          {isAdmin && <ChartBar label="Gastos" value={expenseTotal} max={max} />}
        </div>
      </article>
      <article className="card chart-card">
        <div className="card-title">
          <div>
            <h3>Ultimos ingresos</h3>
            <span>{income.length} movimientos</span>
          </div>
        </div>
        <div className="table-list">
          {income.length === 0 ? (
            <EmptyState title="Sin movimientos todavía" description="Cuando registres ingresos, vas a verlos acá con su monto, fecha y estado." variant="finance" />
          ) : income.slice(0, 4).map((item) => (
            <div className="table-row income-row" key={item.id}>
              <strong>{item.concept}</strong>
              <span>{money.format(item.amount)}</span>
              <span>{formatDate(item.date)}</span>
              <em className={`status ${item.status === 'Recibido' ? 'done' : 'pending'}`}>{item.status}</em>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function ChartBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="chart-row">
      <span>{label}</span>
      <div><i style={{ width: `${Math.max(8, (value / max) * 100)}%` }} /></div>
      <strong>{money.format(value)}</strong>
    </div>
  );
}

export function CalendarView({
  clients,
  serviceById,
  userById,
}: {
  clients: Client[];
  serviceById: (id: string) => string;
  userById: (id: string) => string;
}) {
  const firstMonth = clients[0]?.start ? monthFromDate(clients[0].start) : '2026-06';
  const [month, setMonth] = useState(firstMonth);
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date(`${firstMonth}-01T00:00:00`);
    date.setDate(date.getDate() - mondayIndex(date));
    return date;
  });
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const today = toInputDateLocal(new Date());
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const rangeStart = mode === 'month' ? `${month}-01` : toInputDateLocal(weekStart);
  const rangeEnd = mode === 'month' ? `${month}-${String(daysInMonth).padStart(2, '0')}` : toInputDateLocal(addDays(weekStart, 6));
  const visibleClients = clients.filter((client) => client.delivery >= rangeStart && client.start <= rangeEnd);
  const calendarDays = mode === 'month'
    ? monthDays.map((day) => {
      const key = `${month}-${String(day).padStart(2, '0')}`;
      return { key, label: String(day), isToday: key === today };
    })
    : weekDays.map((date) => {
      const key = toInputDateLocal(date);
      return { key, label: `${weekdayName(date).slice(0, 3)} ${formatDate(key)}`, isToday: key === today };
    });
  const todayIndex = calendarDays.findIndex((day) => day.isToday);
  const timelineStyle = {
    '--days': calendarDays.length,
    '--today-index': Math.max(todayIndex, 0),
  } as CSSProperties;

  function changeMonth(value: string) {
    setMonth(value);
    const next = new Date(`${value}-01T00:00:00`);
    next.setDate(next.getDate() - mondayIndex(next));
    setWeekStart(next);
  }

  function moveWeek(direction: -1 | 1) {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + direction * 7);
      return next;
    });
  }

  return (
    <section className="card calendar-card">
      <div className="card-title">
        <div>
          <h2>{mode === 'month' ? monthTitle(year, monthNumber) : 'Vista semanal'}</h2>
          <span>Clientes como barras por fecha de inicio y entrega</span>
        </div>
        <div className="segmented-actions">
          <button className={mode === 'month' ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setMode('month')}>Mensual</button>
          <button className={mode === 'week' ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setMode('week')}>Semanal</button>
          <input type="month" value={month} onChange={(event) => changeMonth(event.target.value)} />
        </div>
      </div>
      {mode === 'week' && (
        <div className="segmented-actions week-actions">
          <button className="ghost-btn calendar-arrow" onClick={() => moveWeek(-1)}>←</button>
          <span className="week-label">Semana {shortRangeLabel(weekStart, addDays(weekStart, 6))}</span>
          <button className="ghost-btn calendar-arrow" onClick={() => moveWeek(1)}>→</button>
        </div>
      )}
      {visibleClients.length === 0 ? (
        <div className="calendar-empty">
          <EmptyState title="Calendario vacío" description="No hay trabajos con fechas dentro de este período." variant="calendar" />
        </div>
      ) : (
        <div className="calendar-scroll">
          <div className="calendar-hybrid" style={timelineStyle}>
            <aside className="calendar-work-list">
              {visibleClients.map((client) => (
                <article className="calendar-work-item" key={client.id}>
                  <em className={`status ${statusClass(client.status)}`}>{client.status}</em>
                  <h3>{client.name}</h3>
                  <span>{formatDate(client.start)} al {formatDate(client.delivery)}</span>
                  <small>{client.customServiceName || serviceById(client.serviceId)} · {client.assignedTo.map(userById).join(', ')}</small>
                </article>
              ))}
            </aside>
            <div className={todayIndex >= 0 ? 'calendar-hybrid-timeline has-today' : 'calendar-hybrid-timeline'}>
              <div className="calendar-hybrid-days">
                {calendarDays.map((day) => (
                  <div className={day.isToday ? 'calendar-head day today' : 'calendar-head day'} key={day.key}>{day.isToday ? `Hoy ${day.label}` : day.label}</div>
                ))}
              </div>
              {visibleClients.map((client) => (
                <CalendarClientRow key={client.id} client={client} mode={mode} daysCount={calendarDays.length} rangeStart={rangeStart} rangeEnd={rangeEnd} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CalendarClientRow(props: { client: Client; mode: 'month' | 'week'; daysCount: number; rangeStart: string; rangeEnd: string }) {
  const { client, mode, daysCount, rangeStart, rangeEnd } = props;
  const overlapStart = client.start > rangeStart ? client.start : rangeStart;
  const overlapEnd = client.delivery < rangeEnd ? client.delivery : rangeEnd;
  const startIndex = daysBetween(rangeStart, overlapStart);
  const span = daysBetween(overlapStart, overlapEnd) + 1;

  return (
    <div className="calendar-hybrid-row">
      <strong>{client.name}</strong>
      <div className={`calendar-hybrid-track ${mode}`} style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}>
        <div className={`calendar-bar ${statusClass(client.status)}`} style={{ gridColumn: `${startIndex + 1} / span ${span}`, '--client-color': `linear-gradient(135deg, ${client.color}, ${client.color}cc)` } as CSSProperties}>
          <strong>{client.status}</strong>
          <span>{formatDate(client.start)} - {formatDate(client.delivery)}</span>
        </div>
      </div>
    </div>
  );
}

function toInputDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shortRangeLabel(from: Date, to: Date) {
  return `${from.getDate()}-${to.getDate()}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function daysBetween(from: string, to: string) {
  return Math.round((toLocalDate(to).getTime() - toLocalDate(from).getTime()) / 86400000);
}

function toLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}
