import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import type { Client, ClientStatus } from '../domain/client';
import { statusClass } from '../domain/clientStatus';
import type { Service } from '../../services/domain/service';
import type { Task } from '../../tasks/domain/task';
import type { User } from '../../users/domain/user';
import { formatDate } from '../../../shared/date/dateFormatters';
import { money } from '../../../shared/formatters/money';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ActionModal } from '../../../shared/ui/ActionModal';

type ClientForm = Omit<Client, 'id' | 'value' | 'assignedTo'> & { value: string; assignedTo: string[] };
const CLIENT_COLORS = ['#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

type ClientsViewProps = {
  addClient: () => Promise<void> | void;
  clientForm: ClientForm;
  clients: Client[];
  isAdmin: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => Promise<void> | void;
  serviceById: (id: string) => Service | undefined;
  services: Service[];
  setClientForm: Dispatch<SetStateAction<ClientForm>>;
  tasks: Task[];
  userById: (id: string) => string;
  users: User[];
};

export function ClientsView(props: ClientsViewProps) {
  const { addClient, clientForm, clients, isAdmin, onRemove, onUpdate, serviceById, services, setClientForm, tasks, userById, users } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function submit() {
    const value = Number(clientForm.value);
    if (!clientForm.name.trim() || clientForm.assignedTo.length === 0 || (clientForm.value && (Number.isNaN(value) || value < 0))) {
      await addClient();
      return;
    }
    setIsModalOpen(false);
    await addClient();
  }

  return (
    <section className="stack">
      {isAdmin && (
        <section className="card">
          <div className="card-title"><div><h2>Clientes</h2></div></div>
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Crear cliente</button>
        </section>
      )}
      <section className="client-list">
        {clients.length === 0 ? (
          <EmptyState title={isAdmin ? 'Todavía no hay clientes' : 'Todavía no hay trabajos'} description={isAdmin ? 'Creá el primer cliente para empezar a organizar trabajos, fechas y responsables.' : ''} variant="clients" />
        ) : clients.map((client) => (
          <ClientSummary key={client.id} client={client} isAdmin={isAdmin} onRemove={onRemove} onUpdate={onUpdate} pendingTasks={tasks.filter((task) => task.clientId === client.id && !task.completed)} serviceById={serviceById} services={services} userById={userById} users={users} />
        ))}
      </section>
      {isModalOpen && (
        <ActionModal title="Crear cliente" subtitle="Nuevo cliente" onClose={() => setIsModalOpen(false)}>
          <ClientFields canManageAssignments={isAdmin} draft={clientForm} services={services} setDraft={setClientForm} users={users} />
          <button className="primary-btn full" onClick={submit}><Plus size={18} /> Crear cliente</button>
        </ActionModal>
      )}
    </section>
  );
}

function ClientSummary(props: {
  client: Client;
  isAdmin: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => Promise<void> | void;
  pendingTasks: Task[];
  serviceById: (id: string) => Service | undefined;
  services: Service[];
  userById: (id: string) => string;
  users: User[];
}) {
  const { client, isAdmin, onRemove, onUpdate, pendingTasks, serviceById, services, userById, users } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [draft, setDraft] = useState<ClientForm>({ ...client, value: String(client.value) });
  const service = client.customServiceName || serviceById(client.serviceId)?.name || 'Cualquiera';
  const assigned = client.assignedTo.map(userById).join(', ') || 'Sin responsable';

  async function save() {
    const value = Number(draft.value);
    if (!draft.name.trim() || draft.assignedTo.length === 0 || Number.isNaN(value) || value < 0) {
      return;
    }
    setIsEditing(false);
    const { assignedTo, value: _value, ...editableDraft } = draft;
    await onUpdate(client.id, isAdmin ? { ...draft, value } : editableDraft);
  }

  return (
    <article className="card client-card" style={{ borderColor: client.color }}>
      <div className="client-head"><div><h3>{client.name}</h3><p>{service}</p></div><em className={`status ${statusClass(client.status)}`}>{client.status}</em></div>
      <div className="client-progress"><span style={{ width: progressFor(client.status), background: `linear-gradient(90deg, ${client.color}, ${client.color}cc)` }} /></div>
      <p className="client-summary">Inicio {formatDate(client.start)} · Entrega {formatDate(client.delivery)} · Responsable {assigned}</p>
      <div className="inline-actions">
        <button className="ghost-btn" onClick={() => setIsInfoOpen(true)}>Más información</button>
        {isAdmin && <button className="ghost-btn" onClick={() => { setDraft({ ...client, value: String(client.value) }); setIsEditing(true); }}>Editar</button>}
        {isAdmin && <button className="ghost-btn danger" onClick={() => onRemove(client.id)}>Eliminar</button>}
      </div>
      {isInfoOpen && (
        <ActionModal title={client.name} subtitle={service} onClose={() => setIsInfoOpen(false)}>
          <div className="detail-grid"><span><strong>Telefono</strong>{client.phone || '-'}</span>{isAdmin && <span><strong>Valor</strong>{money.format(client.value)}</span>}<span><strong>Inicio</strong>{formatDate(client.start)}</span><span><strong>Entrega</strong>{formatDate(client.delivery)}</span><span><strong>Responsable</strong>{assigned}</span><span><strong>Estado</strong>{client.status}</span></div>
          <p className="notes">{client.notes || 'Sin notas cargadas.'}</p>
          <div className="client-task-list">
            <strong>Tareas pendientes</strong>
            {pendingTasks.length === 0 ? <span>No hay tareas pendientes para este cliente.</span> : pendingTasks.map((task) => (
              <div key={task.id}><b>{task.concept}</b><small>{userById(task.ownerId)}</small></div>
            ))}
          </div>
        </ActionModal>
      )}
      {isEditing && (
        <ActionModal title="Editar cliente" subtitle="Datos completos" onClose={() => setIsEditing(false)}>
          <ClientFields canManageAssignments={isAdmin} draft={draft} services={services} setDraft={setDraft} users={users} />
          <button className="primary-btn full" onClick={save}><Plus size={18} /> Guardar cambios</button>
        </ActionModal>
      )}
    </article>
  );
}

function progressFor(status: ClientStatus) {
  if (status === 'Terminado') return '100%';
  if (status === 'En proceso') return '55%';
  return '15%';
}

function ClientFields(props: { canManageAssignments: boolean; draft: ClientForm; services: Service[]; setDraft: Dispatch<SetStateAction<ClientForm>>; users: User[] }) {
  const { canManageAssignments, draft, services, setDraft, users } = props;
  const serviceValue = draft.customServiceName ? '__custom__' : draft.serviceId;
  const toggleUser = (id: string) => setDraft((current) => ({
    ...current,
    assignedTo: current.assignedTo.includes(id) ? current.assignedTo.filter((userId) => userId !== id) : [...current.assignedTo, id],
  }));

  return (
    <div className="form-grid">
      <input placeholder="Nombre" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <input placeholder="Telefono (opcional)" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
      {canManageAssignments && <input placeholder="Valor" type="number" value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} />}
      <select value={serviceValue} onChange={(event) => {
        const value = event.target.value;
        setDraft({ ...draft, serviceId: value === '__custom__' ? '' : value, customServiceName: value === '__custom__' ? draft.customServiceName || 'Servicio personalizado' : '' });
      }}><option value="">Cualquiera</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}<option value="__custom__">Servicio personalizado</option></select>
      {serviceValue === '__custom__' && <input placeholder="Servicio personalizado" value={draft.customServiceName} onChange={(event) => setDraft({ ...draft, customServiceName: event.target.value })} />}
      {canManageAssignments && <div className="color-picker">
        {CLIENT_COLORS.map((color) => <button key={color} type="button" className={draft.color === color ? 'active' : ''} style={{ background: color }} onClick={() => setDraft({ ...draft, color })} />)}
      </div>}
      <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ClientStatus })}><option>Sin empezar</option><option>En proceso</option><option>Terminado</option></select>
      <input type="date" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} />
      <input type="date" value={draft.delivery} onChange={(event) => setDraft({ ...draft, delivery: event.target.value })} />
      <input placeholder="Notas internas" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      {canManageAssignments && <div className="assignment-picker">
        {users.map((user) => <label key={user.id}><input type="checkbox" checked={draft.assignedTo.includes(user.id)} onChange={() => toggleUser(user.id)} />{user.name}</label>)}
      </div>}
    </div>
  );
}
