import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import type { Service } from '../domain/service';
import { money } from '../../../shared/formatters/money';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ActionModal } from '../../../shared/ui/ActionModal';

type ServiceForm = {
  name: string;
  description: string;
  value: string;
  valueUsd: string;
  active: boolean;
};

type ServicesViewProps = {
  addService: () => Promise<void> | void;
  isAdmin: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Omit<Service, 'id'>>) => Promise<void> | void;
  serviceForm: ServiceForm;
  services: Service[];
  setServiceForm: Dispatch<SetStateAction<ServiceForm>>;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ServicesView({ addService, isAdmin, onRemove, onUpdate, serviceForm, services, setServiceForm }: ServicesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function submit() {
    if (!isValidServiceDraft(serviceForm)) {
      await addService();
      return;
    }
    setIsModalOpen(false);
    await addService();
  }

  return (
    <section className="stack">
      {isAdmin && <section className="card"><div className="card-title"><div><h2>Servicios</h2></div></div><button className="primary-btn" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Agregar servicio</button></section>}
      <section className="service-grid">{services.length === 0 ? <EmptyState title="Todavía no hay servicios" description="Agregá los servicios que ofrece Scaleit para poder asociarlos a nuevos clientes." variant="services" /> : services.map((service) => (
        <ServiceCard key={service.id} isAdmin={isAdmin} onRemove={onRemove} onUpdate={onUpdate} service={service} />
      ))}</section>
      {isModalOpen && (
        <ActionModal title="Agregar servicio" subtitle="Servicio" onClose={() => setIsModalOpen(false)}>
          <ServiceFields draft={serviceForm} setDraft={setServiceForm} />
          <button className="primary-btn full" onClick={submit}><Plus size={18} /> Agregar servicio</button>
        </ActionModal>
      )}
    </section>
  );
}

function ServiceCard({ isAdmin, onRemove, onUpdate, service }: { isAdmin: boolean; onRemove: ServicesViewProps['onRemove']; onUpdate: ServicesViewProps['onUpdate']; service: Service }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ name: service.name, description: service.description, value: service.value ? String(service.value) : '', valueUsd: service.valueUsd ? String(service.valueUsd) : '', active: service.active });

  async function save() {
    if (!isValidServiceDraft(draft)) return;
    const value = Number(draft.value);
    const valueUsd = Number(draft.valueUsd);
    setIsEditing(false);
    await onUpdate(service.id, {
      name: draft.name,
      description: draft.description,
      value: draft.value ? value : 0,
      valueUsd: draft.valueUsd ? valueUsd : null,
      active: draft.active,
    });
  }

  return (
    <article className="card service-card">
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div className="service-prices">
        {service.value > 0 && <div className="service-price"><span>Pesos</span><strong>{money.format(service.value)}</strong></div>}
        {service.valueUsd && <div className="service-price"><span>USD</span><strong>{usd.format(service.valueUsd)}</strong></div>}
      </div>
      <span className="pill">{service.active ? 'Activo' : 'Inactivo'}</span>
      {isAdmin && (
        <div className="inline-actions">
          <button className="ghost-btn" onClick={() => setIsEditing(true)}>Editar</button>
          <button className="ghost-btn" onClick={() => onUpdate(service.id, { active: !service.active })}>{service.active ? 'Desactivar' : 'Activar'}</button>
          <button className="ghost-btn danger" onClick={() => onRemove(service.id)}>Eliminar</button>
        </div>
      )}
      {isEditing && (
        <ActionModal title="Editar servicio" subtitle="Precios y datos" onClose={() => setIsEditing(false)}>
          <ServiceFields draft={draft} setDraft={setDraft} />
          <button className="primary-btn full" onClick={save}>Guardar cambios</button>
        </ActionModal>
      )}
    </article>
  );
}

function ServiceFields<T extends ServiceForm>({ draft, setDraft }: { draft: T; setDraft: Dispatch<SetStateAction<T>> }) {
  return (
    <div className="form-grid three">
      <input placeholder="Servicio" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <input placeholder="Descripcion" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
      <input placeholder="Precio en pesos" type="number" value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} />
      <input placeholder="Precio en USD" type="number" value={draft.valueUsd} onChange={(event) => setDraft({ ...draft, valueUsd: event.target.value })} />
      <select value={draft.active ? 'active' : 'inactive'} onChange={(event) => setDraft({ ...draft, active: event.target.value === 'active' })}>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>
    </div>
  );
}

function isValidServiceDraft(draft: ServiceForm) {
  const value = Number(draft.value);
  const valueUsd = Number(draft.valueUsd);
  return Boolean(draft.name.trim()) && Boolean(draft.value || draft.valueUsd) && (!draft.value || (!Number.isNaN(value) && value > 0)) && (!draft.valueUsd || (!Number.isNaN(valueUsd) && valueUsd > 0));
}
