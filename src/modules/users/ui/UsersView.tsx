import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Shield } from 'lucide-react';
import type { Role, User } from '../domain/user';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ActionModal } from '../../../shared/ui/ActionModal';

type UserForm = { name: string; username: string; password: string; role: Role; area: string };
type RoleForm = { name: string };
type UsersPanel = 'usuarios' | 'crear' | 'roles';

type UsersViewProps = {
  addRole: () => void | Promise<void>;
  addUser: () => void | Promise<void>;
  isAdmin: boolean;
  onUpdateUser: (id: string, patch: Partial<Pick<User, 'name' | 'username' | 'password' | 'role' | 'area'>>) => void | Promise<void>;
  roleForm: RoleForm;
  roles: Role[];
  setRoleForm: Dispatch<SetStateAction<RoleForm>>;
  setUserForm: Dispatch<SetStateAction<UserForm>>;
  setUsersPanel: Dispatch<SetStateAction<UsersPanel>>;
  userForm: UserForm;
  users: User[];
  usersPanel: UsersPanel;
};

export function UsersView(props: UsersViewProps) {
  const { addRole, addUser, isAdmin, onUpdateUser, roleForm, roles, setRoleForm, setUserForm, setUsersPanel, userForm, users, usersPanel } = props;
  const submitUser = () => void Promise.resolve(addUser()).catch(() => undefined);
  const submitRole = () => void Promise.resolve(addRole()).catch(() => undefined);

  return (
    <section className="users-page">
      <div className="users-tabs">
        <button className={usersPanel === 'usuarios' ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setUsersPanel('usuarios')}>Usuarios</button>
        {isAdmin && <button className={usersPanel === 'crear' ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setUsersPanel('crear')}>Crear usuario</button>}
        {isAdmin && <button className={usersPanel === 'roles' ? 'ghost-btn active' : 'ghost-btn'} onClick={() => setUsersPanel('roles')}>Roles</button>}
      </div>

      {isAdmin && usersPanel === 'crear' && (
        <div className="users-admin-grid single-panel">
          <section className="card users-panel">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Usuario</span>
                <h3>Crear acceso</h3>
              </div>
              <span>Login + password</span>
            </div>
            <div className="users-form">
              <input placeholder="Nombre visible" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
              <input placeholder="Login user" value={userForm.username} onChange={(event) => setUserForm({ ...userForm, username: event.target.value })} />
              <input placeholder="Password" type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
              <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <input placeholder="Area" value={userForm.area} onChange={(event) => setUserForm({ ...userForm, area: event.target.value })} />
            </div>
            <button className="primary-btn full" onClick={submitUser}><Shield size={18} /> Crear usuario</button>
          </section>
        </div>
      )}

      {isAdmin && usersPanel === 'roles' && (
        <div className="users-admin-grid single-panel">
          <section className="card users-panel">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Roles</span>
                <h3>Crear rol</h3>
              </div>
              <span>{roles.length} roles</span>
            </div>
            <div className="role-create">
              <input placeholder="Nombre del rol" value={roleForm.name} onChange={(event) => setRoleForm({ name: event.target.value })} />
              <button className="primary-btn" onClick={submitRole}><Plus size={18} /> Crear</button>
            </div>
            <div className="roles-list">
              {roles.map((role) => <span key={role}>{role}</span>)}
            </div>
          </section>
        </div>
      )}

      {usersPanel === 'usuarios' && (
        <div className="users-list">
          {users.length === 0 ? (
            <EmptyState title="Todavía no hay usuarios" description="Creá usuarios para asignar trabajos, permisos y conversaciones internas." variant="users" />
          ) : users.map((user) => <UserCard key={user.id} isAdmin={isAdmin} onUpdateUser={onUpdateUser} roles={roles} user={user} />)}
        </div>
      )}
    </section>
  );
}

function UserCard(props: { isAdmin: boolean; onUpdateUser: UsersViewProps['onUpdateUser']; roles: Role[]; user: User }) {
  const { isAdmin, onUpdateUser, roles, user } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ name: user.name, username: user.username, password: '', role: user.role, area: user.area });

  async function save() {
    if (!draft.name.trim() || !draft.username.trim()) return;
    setIsEditing(false);
    await onUpdateUser(user.id, { ...draft, password: draft.password.trim() });
  }

  return (
    <article className="card user-access-card">
      <div className="avatar">{user.name.slice(0, 1)}</div>
      <div>
        <h3>{user.name}</h3>
        <p>Usuario: {user.username}</p>
        <p>{user.area}</p>
        <span>{user.role}</span>
      </div>
      {isAdmin && <button className="ghost-btn" onClick={() => { setDraft({ name: user.name, username: user.username, password: '', role: user.role, area: user.area }); setIsEditing(true); }}>Editar</button>}
      {isEditing && (
        <ActionModal title="Editar perfil" subtitle="Solo administrador" onClose={() => setIsEditing(false)}>
          <div className="users-form">
            <input placeholder="Nombre visible" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <input placeholder="Login user" value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} />
            <input placeholder="Nueva contraseña (opcional)" type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} />
            <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <input placeholder="Area" value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} />
          </div>
          <button className="primary-btn full" onClick={save}><Shield size={18} /> Guardar perfil</button>
        </ActionModal>
      )}
    </article>
  );
}
