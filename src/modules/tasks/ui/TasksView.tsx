import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import { ActionModal } from '../../../shared/ui/ActionModal';
import { EmptyState } from '../../../shared/ui/EmptyState';
import type { Client } from '../../clients/domain/client';
import type { Task } from '../domain/task';
import type { User } from '../../users/domain/user';

type TaskForm = { concept: string; details: string; clientId: string; assignedTo: string[] };

type TasksViewProps = {
  addTask: () => Promise<void> | void;
  clients: Client[];
  currentUserId: string;
  isAdmin: boolean;
  onRemoveTask: (id: string) => Promise<void> | void;
  onUpdateTask: (id: string, patch: Partial<Pick<Task, 'concept' | 'details'>>) => Promise<void> | void;
  onToggleTask: (id: string, completed: boolean) => Promise<void> | void;
  otherTasks: Task[];
  setTaskForm: Dispatch<SetStateAction<TaskForm>>;
  taskForm: TaskForm;
  tasks: Task[];
  userById: (id: string) => string;
  users: User[];
};

export function TasksView({ addTask, clients, currentUserId, isAdmin, onRemoveTask, onUpdateTask, onToggleTask, otherTasks, setTaskForm, taskForm, tasks, userById, users }: TasksViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGeneral, setShowGeneral] = useState(false);
  const visibleTasks = showGeneral ? otherTasks : tasks;
  const pending = visibleTasks.filter((task) => !task.completed);
  const completed = visibleTasks.filter((task) => task.completed);
  const clientById = (id: string) => clients.find((client) => client.id === id)?.name ?? '';

  async function submit() {
    if (!taskForm.concept.trim()) {
      await addTask();
      return;
    }
    setIsModalOpen(false);
    await addTask();
  }

  return (
    <section className="stack">
      <section className="card">
        <div className="card-title"><div><h2>{showGeneral ? 'Tareas general' : 'Mis tareas'}</h2><span>{showGeneral ? 'Tareas asignadas a otros usuarios' : 'Tus pendientes y tareas completadas'}</span></div><button className="primary-btn" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Crear tarea</button></div>
        {isAdmin && <div className="segmented-actions"><button className={showGeneral ? 'ghost-btn' : 'ghost-btn active'} onClick={() => setShowGeneral(false)}>Mis tareas</button><button className={showGeneral ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setShowGeneral(true)}>Tareas general</button></div>}
      </section>
      <div className="tasks-grid">
        <TaskTable clientById={clientById} title="No realizadas" tasks={pending} onRemoveTask={onRemoveTask} onUpdateTask={onUpdateTask} onToggleTask={onToggleTask} userById={userById} />
        <TaskTable clientById={clientById} title="Realizadas" tasks={completed} onRemoveTask={onRemoveTask} onUpdateTask={onUpdateTask} onToggleTask={onToggleTask} userById={userById} />
      </div>
      {isModalOpen && (
        <ActionModal title="Crear tarea" subtitle="Nueva tarea" onClose={() => setIsModalOpen(false)}>
          <div className="form-grid">
            <input placeholder="Concepto" value={taskForm.concept} onChange={(event) => setTaskForm({ ...taskForm, concept: event.target.value })} />
            <input placeholder="Detalles" value={taskForm.details} onChange={(event) => setTaskForm({ ...taskForm, details: event.target.value })} />
            <select value={taskForm.clientId} onChange={(event) => setTaskForm({ ...taskForm, clientId: event.target.value })}>
              <option value="">Sin cliente conectado</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            {isAdmin && (
              <select value={taskForm.assignedTo[0] ?? currentUserId} onChange={(event) => setTaskForm({ ...taskForm, assignedTo: [event.target.value] })}>
                {users.map((user) => <option key={user.id} value={user.id}>{user.id === currentUserId ? `${user.name} (yo)` : user.name}</option>)}
              </select>
            )}
          </div>
          <button className="primary-btn full" onClick={submit}><Plus size={18} /> Crear tarea</button>
        </ActionModal>
      )}
    </section>
  );
}

function TaskTable({ clientById, title, tasks, onRemoveTask, onUpdateTask, onToggleTask, userById }: { clientById: (id: string) => string; title: string; tasks: Task[]; onRemoveTask: TasksViewProps['onRemoveTask']; onUpdateTask: TasksViewProps['onUpdateTask']; onToggleTask: TasksViewProps['onToggleTask']; userById: TasksViewProps['userById'] }) {
  return (
    <section className="card task-panel">
      <div className="card-title"><div><h3>{title}</h3><span>{tasks.length} tareas</span></div></div>
      {tasks.length === 0 ? (
        <EmptyState title="Sin tareas" description="Cuando haya tareas, van a aparecer acá." variant="calendar" />
      ) : (
        <div className="table-list">
          {tasks.map((task) => (
            <TaskRow clientName={clientById(task.clientId)} key={task.id} onRemoveTask={onRemoveTask} onUpdateTask={onUpdateTask} onToggleTask={onToggleTask} task={task} userName={userById(task.ownerId)} />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskRow({ clientName, onRemoveTask, onUpdateTask, onToggleTask, task, userName }: { clientName: string; onRemoveTask: TasksViewProps['onRemoveTask']; onUpdateTask: TasksViewProps['onUpdateTask']; onToggleTask: TasksViewProps['onToggleTask']; task: Task; userName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [draft, setDraft] = useState({ concept: task.concept, details: task.details });

  async function save() {
    if (!draft.concept.trim()) return;
    setIsEditing(false);
    await onUpdateTask(task.id, draft);
  }

  return (
    <article className="task-row">
      <input type="checkbox" checked={task.completed} onChange={(event) => onToggleTask(task.id, event.target.checked)} />
      <div><strong>{task.concept}</strong><em className="task-owner">{userName}</em>{clientName && <em className="task-owner">{clientName}</em>}{task.details && <p>{task.details}</p>}</div>
      <div className="task-actions">
        {task.details && <button className="ghost-btn" onClick={() => setIsInfoOpen(true)}>Más información</button>}
        <button className="ghost-btn" onClick={() => { setDraft({ concept: task.concept, details: task.details }); setIsEditing(true); }}>Editar</button>
        <button className="ghost-btn danger" onClick={() => onRemoveTask(task.id)}>Borrar</button>
      </div>
      {isInfoOpen && (
        <ActionModal title={task.concept} subtitle="Detalles de la tarea" onClose={() => setIsInfoOpen(false)}>
          <p className="notes">{task.details}</p>
        </ActionModal>
      )}
      {isEditing && (
        <ActionModal title="Editar tarea" subtitle="Actualizar datos" onClose={() => setIsEditing(false)}>
          <div className="form-grid">
            <label className="field-label">Concepto<input placeholder="Concepto" value={draft.concept} onChange={(event) => setDraft({ ...draft, concept: event.target.value })} /></label>
            <label className="field-label">Detalles<input placeholder="Detalles" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} /></label>
          </div>
          <button className="primary-btn full" onClick={save}>Guardar cambios</button>
        </ActionModal>
      )}
    </article>
  );
}
