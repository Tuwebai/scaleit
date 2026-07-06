import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Income, IncomeKind, IncomeStatus } from '../domain/finance';
import type { User } from '../../users/domain/user';
import { money } from '../../../shared/formatters/money';
import { ActionModal } from '../../../shared/ui/ActionModal';

type IncomeForm = {
  concept: string;
  description: string;
  amount: string;
  ownerId: string;
  kind: IncomeKind;
  status: IncomeStatus;
};

type FinanceViewProps = {
  addIncome: () => Promise<void> | void;
  allIncome: Income[];
  canViewAll: boolean;
  currentUserId: string;
  incomeForm: IncomeForm;
  isAdmin: boolean;
  onRemoveIncome: (id: string) => Promise<void> | void;
  onUpdateIncomeStatus: (id: string, status: IncomeStatus) => Promise<void> | void;
  setIncomeForm: Dispatch<SetStateAction<IncomeForm>>;
  userIncome: Income[];
  users: User[];
};

export function FinanceView(props: FinanceViewProps) {
  const { addIncome, allIncome, canViewAll, currentUserId, incomeForm, isAdmin, onRemoveIncome, onUpdateIncomeStatus, setIncomeForm, userIncome, users } = props;
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<IncomeKind>('Ingreso');
  const daysToPayday = getDaysToNextFriday();
  const scopedIncome = canViewAll ? allIncome : userIncome;
  const receivedIncomeTotal = scopedIncome.filter((item) => item.kind === 'Ingreso' && item.status === 'Recibido').reduce((acc, item) => acc + item.amount, 0);
  const incomeItems = sortPendingFirst(scopedIncome.filter((item) => item.kind === 'Ingreso'));
  const depositItems = sortPendingFirst(scopedIncome.filter((item) => item.kind === 'Deposito'));
  const pendingIncome = incomeItems.filter((item) => item.status === 'Pendiente');
  const pendingDeposits = depositItems.filter((item) => item.status === 'Pendiente');
  const pendingIncomeTotal = pendingIncome.reduce((acc, item) => acc + item.amount, 0);
  const pendingDepositsTotal = pendingDeposits.reduce((acc, item) => acc + item.amount, 0);

  function userById(id: string) {
    return users.find((user) => user.id === id)?.name ?? 'Sin persona';
  }

  function openIncomeModal(kind: IncomeKind) {
    setModalKind(kind);
    setIncomeForm((current) => ({
      ...current,
      kind,
      status: 'Pendiente',
      ownerId: kind === 'Deposito' ? current.ownerId || users[0]?.id || currentUserId : currentUserId,
    }));
    setIncomeModalOpen(true);
  }

  async function submitIncome() {
    if (!incomeForm.concept.trim() || Number(incomeForm.amount) <= 0) {
      await addIncome();
      return;
    }
    setIncomeModalOpen(false);
    await addIncome();
  }

  return (
    <section className="stack">
      <section className="finance-grid">
        <article className="metric green"><span>Ingresos</span><strong>{money.format(receivedIncomeTotal)}</strong></article>
        <article className="metric gray"><span>Ingresos pendientes</span><strong>{money.format(pendingIncomeTotal)}</strong></article>
        <article className="metric gray"><span>Depósitos pendientes</span><strong>{money.format(pendingDepositsTotal)}</strong></article>
        <article className="metric green"><span>Próximo día de pago en</span><strong>{daysToPayday === 0 ? 'Hoy' : `${daysToPayday} días`}</strong></article>
      </section>

      <section className="finance-panels">
        {canViewAll && (
          <PendingFinancePanel
            actionLabel="Registrar ingreso pendiente"
            empty="No hay ingresos pendientes."
            isAdmin={isAdmin}
            items={incomeItems}
            onCreate={() => openIncomeModal('Ingreso')}
            onRemoveIncome={onRemoveIncome}
            onUpdateIncomeStatus={onUpdateIncomeStatus}
            title="Ingresos pendientes"
            total={pendingIncomeTotal}
            userById={userById}
          />
        )}
        <PendingFinancePanel
          actionLabel={canViewAll ? 'Crear depósito pendiente' : 'Solicitar depósito'}
          empty="No hay depósitos pendientes."
          isAdmin={isAdmin}
          items={depositItems}
          onCreate={() => openIncomeModal('Deposito')}
          onRemoveIncome={onRemoveIncome}
          onUpdateIncomeStatus={onUpdateIncomeStatus}
          title="Depósitos pendientes"
          total={pendingDepositsTotal}
          userById={userById}
        />
      </section>

      {incomeModalOpen && (
        <ActionModal title={modalKind === 'Ingreso' ? 'Registrar ingreso pendiente' : canViewAll ? 'Crear depósito pendiente' : 'Solicitar depósito'} subtitle="Finanzas" onClose={() => setIncomeModalOpen(false)}>
          <div className="form-grid three">
            <input placeholder={modalKind === 'Ingreso' ? 'Cliente o concepto' : 'Concepto'} value={incomeForm.concept} onChange={(event) => setIncomeForm({ ...incomeForm, concept: event.target.value })} />
            <input placeholder="Monto" type="number" value={incomeForm.amount} onChange={(event) => setIncomeForm({ ...incomeForm, amount: event.target.value })} />
            {modalKind === 'Deposito' && canViewAll && (
              <select value={incomeForm.ownerId} onChange={(event) => setIncomeForm({ ...incomeForm, ownerId: event.target.value })}>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            )}
            <input placeholder="Descripción opcional" value={incomeForm.description} onChange={(event) => setIncomeForm({ ...incomeForm, description: event.target.value })} />
          </div>
          <button className="primary-btn full" onClick={submitIncome}><Plus size={18} /> Guardar pendiente</button>
        </ActionModal>
      )}
    </section>
  );
}

function PendingFinancePanel({ actionLabel, empty, isAdmin, items, onCreate, onRemoveIncome, onUpdateIncomeStatus, title, total, userById }: {
  actionLabel: string;
  empty: string;
  isAdmin: boolean;
  items: Income[];
  onCreate: () => void;
  onRemoveIncome: FinanceViewProps['onRemoveIncome'];
  onUpdateIncomeStatus: FinanceViewProps['onUpdateIncomeStatus'];
  title: string;
  total: number;
  userById: (id: string) => string;
}) {
  return (
    <section className="card finance-pending-card">
      <div className="card-title"><div><h3>{title}</h3><span>Total: {money.format(total)}</span></div><button className="primary-btn" onClick={onCreate}><Plus size={18} /> {actionLabel}</button></div>
      <div className="table-list">
        {items.length === 0 ? <p className="muted-empty">{empty}</p> : items.map((item) => (
          <PaymentCheck key={item.id} item={item} isAdmin={isAdmin} onRemoveIncome={onRemoveIncome} onUpdateIncomeStatus={onUpdateIncomeStatus} userName={userById(item.ownerId)} />
        ))}
      </div>
    </section>
  );
}

function PaymentCheck({ item, isAdmin, onRemoveIncome, onUpdateIncomeStatus, userName }: { item: Income; isAdmin: boolean; onRemoveIncome: FinanceViewProps['onRemoveIncome']; onUpdateIncomeStatus: FinanceViewProps['onUpdateIncomeStatus']; userName: string }) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <label className={item.status === 'Recibido' ? 'payment-check completed' : 'payment-check'}>
        <input type="checkbox" checked={item.status === 'Recibido'} onChange={(event) => onUpdateIncomeStatus(item.id, event.target.checked ? 'Recibido' : 'Pendiente')} />
        <div><strong>{item.concept}</strong>{item.description && <small>{item.description}</small>}<em>{userName}</em></div>
        <span className="payment-amount">{money.format(item.amount)}</span>
        {isAdmin && <button className="delete-icon-btn" aria-label="Eliminar" type="button" onClick={(event) => { event.preventDefault(); onRemoveIncome(item.id); }}><Trash2 size={17} /></button>}
        <div className="payment-actions">
          {item.description && <button className="ghost-btn" type="button" onClick={(event) => { event.preventDefault(); setIsInfoOpen(true); }}>Más información</button>}
        </div>
      </label>
      {isInfoOpen && (
        <ActionModal title={item.concept} subtitle="Descripción" onClose={() => setIsInfoOpen(false)}>
          <p className="notes">{item.description}</p>
        </ActionModal>
      )}
    </>
  );
}

function getDaysToNextFriday() {
  const today = new Date();
  const friday = 5;
  return (friday - today.getDay() + 7) % 7;
}

function sortPendingFirst(items: Income[]) {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Pendiente' ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}
