import { useEffect, useRef, useState } from 'react';
import { Download, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { useAuthSession } from './modules/auth/application/useAuthSession';
import { signOut } from './modules/auth/infrastructure/authService';
import { LoginView } from './modules/auth/ui/LoginView';
import type { Client, ClientStatus } from './modules/clients/domain/client';
import { createClientsRepository } from './modules/clients/infrastructure/clientsRepository';
import { ClientsView } from './modules/clients/ui/ClientsView';
import type { Expense, Income, IncomeKind, IncomeStatus } from './modules/finance/domain/finance';
import { createFinanceRepository } from './modules/finance/infrastructure/financeRepository';
import { FinanceView } from './modules/finance/ui/FinanceView';
import type { Message } from './modules/messages/domain/message';
import { createMessagesRepository } from './modules/messages/infrastructure/messagesRepository';
import { MessagesView } from './modules/messages/ui/MessagesView';
import type { Service } from './modules/services/domain/service';
import { createServicesRepository } from './modules/services/infrastructure/servicesRepository';
import { ServicesView } from './modules/services/ui/ServicesView';
import { navItems } from './modules/shell/config/navItems';
import type { Section } from './modules/shell/domain/section';
import type { Task } from './modules/tasks/domain/task';
import { createTasksRepository } from './modules/tasks/infrastructure/tasksRepository';
import { TasksView } from './modules/tasks/ui/TasksView';
import type { Role, User } from './modules/users/domain/user';
import { createUsersRepository } from './modules/users/infrastructure/usersRepository';
import { UsersView } from './modules/users/ui/UsersView';
import { darkLogoUrl, logoUrl } from './shared/config/brand';
import { getFinanceRange, isDateInRange } from './shared/date/dateRange';
import { humanizeError } from './shared/errors/humanizeError';
import { CalendarView, titleFor } from './shared/ui/viewComponents';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function App() {
  const auth = useAuthSession();
  const [active, setActive] = useState<Section>(() => {
    const savedSection = localStorage.getItem('scaleit.activeSection') as Section | null;
    return savedSection && navItems.some((item) => item.id === savedSection) ? savedSection : 'clientes';
  });
  const [dark, setDark] = useState(() => localStorage.getItem('scaleit.darkMode') === 'true');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>(['Mayor rango', 'Operativo', 'Finanzas']);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clientForm, setClientForm] = useState({ name: '', phone: '', value: '', serviceId: '', customServiceName: '', color: '#f97316', status: 'Sin empezar' as ClientStatus, start: '2026-06-24', delivery: '2026-07-01', assignedTo: [] as string[], notes: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', value: '', valueUsd: '', active: true });
  const [incomeForm, setIncomeForm] = useState({ concept: '', description: '', amount: '', ownerId: '', kind: 'Deposito' as IncomeKind, status: 'Pendiente' as IncomeStatus });
  const [taskForm, setTaskForm] = useState({ concept: '', details: '', assignedTo: [] as string[] });
  const [expenseForm, setExpenseForm] = useState({ concept: '', amount: '' });
  const [financeFilter, setFinanceFilter] = useState(() => {
    const savedFilter = localStorage.getItem('scaleit.financeFilter');
    if (!savedFilter) return { type: 'month' as 'week' | 'month' | 'custom', from: '2026-06-01', to: '2026-06-30' };
    try {
      return JSON.parse(savedFilter) as { type: 'week' | 'month' | 'custom'; from: string; to: string };
    } catch {
      return { type: 'month' as const, from: '2026-06-01', to: '2026-06-30' };
    }
  });
  const [messageForm, setMessageForm] = useState({ to: '', body: '' });
  const [activeChatUserId, setActiveChatUserId] = useState('');
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'Operativo' as Role, area: '' });
  const [roleForm, setRoleForm] = useState({ name: '' });
  const [usersPanel, setUsersPanel] = useState<'usuarios' | 'crear' | 'roles'>('usuarios');
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallApp, setCanInstallApp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1280px)').matches);

  function showToast(tone: 'success' | 'error', text: string) {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast({ tone, text });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3200);
  }

  function showError(error: unknown, fallback: string) {
    showToast('error', humanizeError(error, fallback));
  }

  async function installApp() {
    if (installPromptRef.current) {
      await installPromptRef.current.prompt();
      const choice = await installPromptRef.current.userChoice;
      if (choice.outcome === 'accepted') setCanInstallApp(false);
      installPromptRef.current = null;
      return;
    }
    showToast('success', 'En tu tablet: menú Compartir u opciones del navegador → Agregar a pantalla de inicio.');
  }

  async function loadData() {
    if (auth.isAuthEnabled && !auth.user) return;
    const [nextUsers, nextRoles, nextServices, nextClients, nextIncome, nextExpenses, nextMessages, nextTasks] = await Promise.all([
      createUsersRepository().list(),
      createUsersRepository().listRoles(),
      createServicesRepository().list(),
      createClientsRepository().list(),
      createFinanceRepository().listIncome(),
      createFinanceRepository().listExpenses(),
      createMessagesRepository().list(),
      createTasksRepository().list(),
    ]);
    setUsers(nextUsers);
    setRoles(nextRoles);
    setServices(nextServices);
    setClients(nextClients);
    setIncome(nextIncome);
    setExpenses(nextExpenses);
    setMessages(nextMessages);
    setTasks(nextTasks);
    setActiveChatUserId((current) => {
      const currentProfileId = auth.user?.id || nextUsers[0]?.id || '';
      return current && current !== currentProfileId ? current : '';
    });
    setClientForm((current) => ({
      ...current,
      assignedTo: current.assignedTo.length > 0 ? current.assignedTo : auth.user?.id ? [auth.user.id] : nextUsers[0]?.id ? [nextUsers[0].id] : [],
    }));
  }

  useEffect(() => {
    loadData().catch((error) => showError(error, 'No pudimos cargar la información. Probá recargando la página.'));
  }, [auth.isAuthEnabled, auth.user]);

  useEffect(() => {
    localStorage.setItem('scaleit.activeSection', active);
  }, [active]);

  useEffect(() => {
    localStorage.setItem('scaleit.darkMode', String(dark));
  }, [dark]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (isStandalone) return;
    const isPortableDevice = window.matchMedia('(pointer: coarse) and (max-width: 1180px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isPortableDevice) return;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstallApp(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    setCanInstallApp(true);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    localStorage.setItem('scaleit.financeFilter', JSON.stringify(financeFilter));
  }, [financeFilter]);

  const authProfile = users.find((user) => user.id === auth.user?.id);
  const currentUser = authProfile ?? users[0] ?? { id: '', name: 'Sin usuario', username: '', password: '', role: 'Operativo', area: '' };
  const isAdmin = currentUser.role === 'Mayor rango';
  const isOperative = currentUser.role === 'Operativo';
  const canViewAllFinance = isAdmin || currentUser.role === 'Finanzas';
  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'tareas') return isOperative || isAdmin;
    return isAdmin || !['servicios', 'usuarios'].includes(item.id);
  });
  const visibleClients = isAdmin ? clients : clients.filter((client) => client.assignedTo.includes(currentUser.id));
  const visibleTasks = isAdmin ? tasks : tasks.filter((task) => task.ownerId === currentUser.id);
  const financeRange = getFinanceRange(financeFilter);
  const periodIncome = income.filter((item) => isDateInRange(item.date, financeRange.from, financeRange.to));
  const periodExpenses = expenses.filter((item) => isDateInRange(item.date, financeRange.from, financeRange.to));
  const periodReceived = periodIncome.filter((item) => item.status === 'Recibido').reduce((acc, item) => acc + item.amount, 0);
  const periodPending = periodIncome.filter((item) => item.status === 'Pendiente').reduce((acc, item) => acc + item.amount, 0);
  const periodExpenseTotal = periodExpenses.reduce((acc, item) => acc + item.amount, 0);
  const userIncome = income.filter((item) => item.ownerId === currentUser.id);
  const userReceived = userIncome.filter((item) => item.status === 'Recibido').reduce((acc, item) => acc + item.amount, 0);
  const userPending = userIncome.filter((item) => item.status === 'Pendiente').reduce((acc, item) => acc + item.amount, 0);
  const unreadMessages = messages.filter((message) => message.to === currentUser.id && message.unread).length;
  const activeChatUser = users.find((user) => user.id === activeChatUserId && user.id !== currentUser.id);
  const chatMessages = messages
    .filter((message) => activeChatUser && ((message.from === currentUser.id && message.to === activeChatUser.id) || (message.from === activeChatUser.id && message.to === currentUser.id)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const serviceById = (id: string) => services.find((service) => service.id === id);
  const userById = (id: string) => users.find((user) => user.id === id)?.name ?? 'Sin usuario';

  useEffect(() => {
    if (active === 'mensajes' && currentUser.id && activeChatUserId && activeChatUserId !== currentUser.id) {
      void openConversation(activeChatUserId);
    }
  }, [active, activeChatUserId, currentUser.id]);

  useEffect(() => {
    if (!isAdmin && usersPanel !== 'usuarios') {
      setUsersPanel('usuarios');
    }
  }, [isAdmin, usersPanel]);

  async function addClient() {
    setToast(null);
    const service = serviceById(clientForm.serviceId);
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede crear clientes.');
      throw new Error('Solo el usuario de mayor rango puede crear clientes.');
    }
    if (!clientForm.name.trim()) {
      showToast('error', 'Ingresá el nombre del cliente.');
      throw new Error('Ingresá el nombre del cliente.');
    }
    if (clientForm.customServiceName.trim() && clientForm.serviceId) {
      showToast('error', 'Elegí un servicio existente o usá uno personalizado.');
      throw new Error('Elegí un servicio existente o usá uno personalizado.');
    }
    if (clientForm.assignedTo.length === 0) {
      showToast('error', 'Seleccioná al menos un usuario asignado.');
      throw new Error('Seleccioná al menos un usuario asignado.');
    }
    const customValue = Number(clientForm.value);
    if (clientForm.value && (Number.isNaN(customValue) || customValue < 0)) {
      showToast('error', 'Ingresá un valor válido para el cliente.');
      throw new Error('Ingresá un valor válido para el cliente.');
    }
    const tempId = crypto.randomUUID();
    const optimisticClient: Client = {
      id: tempId,
      name: clientForm.name,
      phone: clientForm.phone,
      value: clientForm.value ? customValue : service?.value ?? 0,
      serviceId: service?.id ?? '',
      customServiceName: clientForm.customServiceName.trim(),
      color: clientForm.color,
      status: clientForm.status,
      start: clientForm.start,
      delivery: clientForm.delivery,
      assignedTo: clientForm.assignedTo,
      notes: clientForm.notes,
    };
    setClients((prev) => [optimisticClient, ...prev]);
    setClientForm({ name: '', phone: '', value: '', serviceId: '', customServiceName: '', color: '#f97316', status: 'Sin empezar', start: '2026-06-24', delivery: '2026-07-01', assignedTo: users[0]?.id ? [users[0].id] : [], notes: '' });
    try {
      const client = await createClientsRepository().create(optimisticClient);
      setClients((prev) => prev.map((item) => item.id === tempId ? client : item));
      showToast('success', 'Cliente creado.');
      await loadData();
    } catch (error) {
      setClients((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos crear el cliente. Revisá los datos e intentá de nuevo.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function addService() {
    setToast(null);
    const value = Number(serviceForm.value);
    const valueUsd = Number(serviceForm.valueUsd);
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede crear servicios.');
      throw new Error('Solo el usuario de mayor rango puede crear servicios.');
    }
    if (!serviceForm.name.trim()) {
      showToast('error', 'Ingresá el nombre del servicio.');
      throw new Error('Ingresá el nombre del servicio.');
    }
    if ((!serviceForm.value && !serviceForm.valueUsd) || (serviceForm.value && (Number.isNaN(value) || value <= 0)) || (serviceForm.valueUsd && (Number.isNaN(valueUsd) || valueUsd <= 0))) {
      showToast('error', 'Ingresá al menos un precio válido en pesos o USD.');
      throw new Error('Ingresá al menos un precio válido en pesos o USD.');
    }
    const tempId = crypto.randomUUID();
    const optimisticService: Service = { id: tempId, name: serviceForm.name, description: serviceForm.description, value: serviceForm.value ? value : 0, valueUsd: serviceForm.valueUsd ? valueUsd : null, active: serviceForm.active };
    setServices((prev) => [optimisticService, ...prev]);
    setServiceForm({ name: '', description: '', value: '', valueUsd: '', active: true });
    try {
      const service = await createServicesRepository().create({ name: optimisticService.name, description: optimisticService.description, value: optimisticService.value, valueUsd: optimisticService.valueUsd, active: optimisticService.active });
      setServices((prev) => prev.map((item) => item.id === tempId ? service : item));
      showToast('success', 'Servicio creado.');
      await loadData();
    } catch (error) {
      setServices((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos crear el servicio. Revisá los datos e intentá de nuevo.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function addIncome() {
    setToast(null);
    const amount = Number(incomeForm.amount);
    if (!incomeForm.concept.trim()) {
      showToast('error', 'Ingresá el concepto del ingreso.');
      throw new Error('Ingresá el concepto del ingreso.');
    }
    if (Number.isNaN(amount) || amount <= 0) {
      showToast('error', 'Ingresá un monto válido.');
      throw new Error('Ingresá un monto válido.');
    }
    const tempId = crypto.randomUUID();
    const optimisticIncome: Income = { id: tempId, concept: incomeForm.concept, description: incomeForm.description, amount, date: new Date().toISOString().slice(0, 10), ownerId: incomeForm.ownerId || currentUser.id, kind: incomeForm.kind, status: incomeForm.status };
    setIncome((prev) => [optimisticIncome, ...prev]);
    setIncomeForm({ concept: '', description: '', amount: '', ownerId: '', kind: 'Deposito', status: 'Pendiente' });
    try {
      const nextIncome = await createFinanceRepository().createIncome(optimisticIncome);
      setIncome((prev) => prev.map((item) => item.id === tempId ? nextIncome : item));
      showToast('success', 'Ingreso registrado.');
      await loadData();
    } catch (error) {
      setIncome((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos registrar el ingreso. Revisá el monto e intentá de nuevo.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function addTask() {
    setToast(null);
    if (!taskForm.concept.trim()) {
      showToast('error', 'Completá el concepto.');
      throw new Error('Completá el concepto.');
    }
    const ownerIds = isAdmin && taskForm.assignedTo.length > 0 ? taskForm.assignedTo : [currentUser.id];
    const optimisticTasks: Task[] = ownerIds.map((ownerId) => ({ id: crypto.randomUUID(), category: 'General', concept: taskForm.concept, details: taskForm.details, completed: false, ownerId }));
    setTasks((prev) => [...optimisticTasks, ...prev]);
    setTaskForm({ concept: '', details: '', assignedTo: [] });
    try {
      const createdTasks = await Promise.all(optimisticTasks.map((task) => createTasksRepository().create(task)));
      setTasks((prev) => prev.map((item) => createdTasks.find((task) => task.ownerId === item.ownerId && optimisticTasks.some((draft) => draft.id === item.id)) ?? item));
      showToast('success', ownerIds.length > 1 ? 'Tareas creadas.' : 'Tarea creada.');
      await loadData();
    } catch (error) {
      setTasks((prev) => prev.filter((item) => !optimisticTasks.some((task) => task.id === item.id)));
      showError(error, 'No pudimos crear la tarea. Intentá de nuevo.');
      throw error;
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    const previous = tasks;
    setTasks((items) => items.map((item) => item.id === id ? { ...item, completed } : item));
    try {
      const task = await createTasksRepository().update(id, { completed });
      setTasks((items) => items.map((item) => item.id === id ? task : item));
      await loadData();
    } catch (error) {
      setTasks(previous);
      showError(error, 'No pudimos actualizar la tarea. Intentá de nuevo.');
    }
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, 'concept' | 'details'>>) {
    const previous = tasks;
    setTasks((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    try {
      const task = await createTasksRepository().update(id, patch);
      setTasks((items) => items.map((item) => item.id === id ? task : item));
      showToast('success', 'Tarea actualizada.');
      await loadData();
    } catch (error) {
      setTasks(previous);
      showError(error, 'No pudimos actualizar la tarea. Intentá de nuevo.');
      throw error;
    }
  }

  async function removeTask(id: string) {
    const previous = tasks;
    setTasks((items) => items.filter((item) => item.id !== id));
    try {
      await createTasksRepository().remove(id);
      showToast('success', 'Tarea borrada.');
      await loadData();
    } catch (error) {
      setTasks(previous);
      showError(error, 'No pudimos borrar la tarea. Intentá de nuevo.');
    }
  }

  async function addExpense() {
    setToast(null);
    const amount = Number(expenseForm.amount);
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede registrar gastos.');
      throw new Error('Solo el usuario de mayor rango puede registrar gastos.');
    }
    if (!expenseForm.concept.trim()) {
      showToast('error', 'Ingresá el concepto del gasto.');
      throw new Error('Ingresá el concepto del gasto.');
    }
    if (Number.isNaN(amount) || amount <= 0) {
      showToast('error', 'Ingresá un monto válido.');
      throw new Error('Ingresá un monto válido.');
    }
    const tempId = crypto.randomUUID();
    const optimisticExpense: Expense = { id: tempId, concept: expenseForm.concept, amount, date: new Date().toISOString().slice(0, 10) };
    setExpenses((prev) => [optimisticExpense, ...prev]);
    setExpenseForm({ concept: '', amount: '' });
    try {
      const expense = await createFinanceRepository().createExpense(optimisticExpense);
      setExpenses((prev) => prev.map((item) => item.id === tempId ? expense : item));
      showToast('success', 'Gasto registrado.');
      await loadData();
    } catch (error) {
      setExpenses((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos registrar el gasto. Revisá el monto e intentá de nuevo.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function sendMessage() {
    setToast(null);
    if (!messageForm.body.trim()) {
      showToast('error', 'Escribí un mensaje antes de enviarlo.');
      throw new Error('Escribí un mensaje antes de enviarlo.');
    }
    if (!activeChatUser?.id || activeChatUser.id === currentUser.id) {
      showToast('error', 'No hay un usuario seleccionado para enviar el mensaje.');
      throw new Error('No hay un usuario seleccionado para enviar el mensaje.');
    }
    const tempId = crypto.randomUUID();
    const now = new Date();
    const optimisticMessage: Message = { id: tempId, from: currentUser.id, to: activeChatUser.id, body: messageForm.body.trim(), unread: true, createdAt: now.toISOString(), time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageForm({ to: activeChatUser.id, body: '' });
    try {
      const message = await createMessagesRepository().create(optimisticMessage);
      setMessages((prev) => prev.map((item) => item.id === tempId ? message : item));
      await loadData();
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos enviar el mensaje. Probá de nuevo en unos segundos.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function openConversation(userId: string) {
    if (!userId || userId === currentUser.id) return;
    setActiveChatUserId(userId);
    setMessages((prev) => prev.map((message) => (
      message.from === userId && message.to === currentUser.id ? { ...message, unread: false } : message
    )));
    try {
      await createMessagesRepository().markConversationAsRead(userId, currentUser.id);
    } catch (error) {
      showError(error, 'No pudimos marcar los mensajes como leídos. La conversación igual está disponible.');
    }
  }

  async function addUser() {
    setToast(null);
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede crear usuarios.');
      throw new Error('Solo el usuario de mayor rango puede crear usuarios.');
    }
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password.trim()) {
      showToast('error', 'Completá nombre, usuario o email, y contraseña.');
      throw new Error('Completá nombre, usuario o email, y contraseña.');
    }
    const tempId = crypto.randomUUID();
    const optimisticUser: User = { id: tempId, ...userForm };
    setUsers((prev) => [optimisticUser, ...prev]);
    setUserForm({ name: '', username: '', password: '', role: roles[0] ?? 'Operativo', area: '' });
    try {
      const user = await createUsersRepository().create(optimisticUser);
      setUsers((prev) => prev.map((item) => item.id === tempId ? user : item));
      showToast('success', 'Usuario creado.');
      await loadData();
    } catch (error) {
      setUsers((prev) => prev.filter((item) => item.id !== tempId));
      const message = humanizeError(error, 'No pudimos crear el usuario. Revisá el usuario o email y la contraseña.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function updateUser(id: string, patch: Partial<Pick<User, 'name' | 'username' | 'password' | 'role' | 'area'>>) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede editar perfiles.');
      return;
    }
    if (patch.password?.trim() && patch.password.trim().length < 6) {
      showToast('error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const previous = users;
    const { password: _password, ...visiblePatch } = patch;
    setToast(null);
    setUsers((items) => items.map((item) => item.id === id ? { ...item, ...visiblePatch } : item));
    try {
      const user = await createUsersRepository().update(id, patch);
      setUsers((items) => items.map((item) => item.id === id ? user : item));
      showToast('success', 'Perfil actualizado.');
      await loadData();
    } catch (error) {
      setUsers(previous);
      showError(error, 'No pudimos actualizar el perfil. Intentá de nuevo.');
      throw error;
    }
  }

  async function addRole() {
    setToast(null);
    const roleName = roleForm.name.trim();
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede crear roles.');
      throw new Error('Solo el usuario de mayor rango puede crear roles.');
    }
    if (!roleName) {
      showToast('error', 'Ingresá el nombre del rol.');
      throw new Error('Ingresá el nombre del rol.');
    }
    if (roles.includes(roleName)) {
      showToast('error', 'Ese rol ya existe.');
      throw new Error('Ese rol ya existe.');
    }
    setRoles((prev) => [...prev, roleName]);
    setRoleForm({ name: '' });
    try {
      await createUsersRepository().createRole(roleName);
      showToast('success', 'Rol creado.');
      await loadData();
    } catch (error) {
      setRoles((prev) => prev.filter((role) => role !== roleName));
      const message = humanizeError(error, 'No pudimos crear el rol. Revisá el nombre e intentá de nuevo.');
      showToast('error', message);
      throw new Error(message);
    }
  }

  async function updateClient(id: string, patch: Partial<Omit<Client, 'id'>>) {
    const targetClient = clients.find((item) => item.id === id);
    if (!targetClient || (!isAdmin && !targetClient.assignedTo.includes(currentUser.id))) {
      showToast('error', 'No tenés permisos para editar este cliente.');
      return;
    }
    const safePatch = isAdmin ? patch : { ...patch, assignedTo: undefined, value: undefined };
    const previous = clients;
    setToast(null);
    setClients((items) => items.map((item) => item.id === id ? { ...item, ...safePatch } : item));
    try {
      const client = await createClientsRepository().update(id, safePatch);
      setClients((items) => items.map((item) => item.id === id ? { ...item, ...client, assignedTo: safePatch.assignedTo ?? item.assignedTo } : item));
      showToast('success', 'Cliente actualizado.');
      await loadData();
    } catch (error) {
      setClients(previous);
      showError(error, 'No pudimos actualizar el cliente. Intentá de nuevo.');
    }
  }

  async function removeClient(id: string) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede eliminar clientes.');
      return;
    }
    const previous = clients;
    setToast(null);
    setClients((items) => items.filter((item) => item.id !== id));
    try {
      await createClientsRepository().remove(id);
      showToast('success', 'Cliente eliminado.');
      await loadData();
    } catch (error) {
      setClients(previous);
      showError(error, 'No pudimos eliminar el cliente. Intentá de nuevo.');
    }
  }

  async function updateService(id: string, patch: Partial<Omit<Service, 'id'>>) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede modificar servicios.');
      return;
    }
    const previous = services;
    setToast(null);
    setServices((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    try {
      const service = await createServicesRepository().update(id, patch);
      setServices((items) => items.map((item) => item.id === id ? service : item));
      showToast('success', 'Servicio actualizado.');
      await loadData();
    } catch (error) {
      setServices(previous);
      showError(error, 'No pudimos actualizar el servicio. Intentá de nuevo.');
    }
  }

  async function removeService(id: string) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede eliminar servicios.');
      return;
    }
    const previous = services;
    setToast(null);
    setServices((items) => items.filter((item) => item.id !== id));
    try {
      await createServicesRepository().remove(id);
      showToast('success', 'Servicio eliminado.');
      await loadData();
    } catch (error) {
      setServices(previous);
      showError(error, 'No pudimos eliminar el servicio. Intentá de nuevo.');
    }
  }

  async function updateIncomeStatus(id: string, status: IncomeStatus) {
    const targetIncome = income.find((item) => item.id === id);
    if (!targetIncome || (!isAdmin && targetIncome.ownerId !== currentUser.id && currentUser.role !== 'Finanzas')) {
      showToast('error', 'No tenés permisos para actualizar este ingreso.');
      return;
    }
    const previous = income;
    setToast(null);
    setIncome((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    try {
      const nextIncome = await createFinanceRepository().updateIncome(id, { status });
      setIncome((items) => items.map((item) => item.id === id ? nextIncome : item));
      showToast('success', 'Ingreso actualizado.');
      await loadData();
    } catch (error) {
      setIncome(previous);
      showError(error, 'No pudimos actualizar el ingreso. Intentá de nuevo.');
    }
  }

  async function removeIncome(id: string) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede eliminar ingresos.');
      return;
    }
    const previous = income;
    setToast(null);
    setIncome((items) => items.filter((item) => item.id !== id));
    try {
      await createFinanceRepository().removeIncome(id);
      showToast('success', 'Ingreso eliminado.');
      await loadData();
    } catch (error) {
      setIncome(previous);
      showError(error, 'No pudimos eliminar el ingreso. Intentá de nuevo.');
    }
  }

  async function removeExpense(id: string) {
    if (!isAdmin) {
      showToast('error', 'Solo el usuario de mayor rango puede eliminar gastos.');
      return;
    }
    const previous = expenses;
    setToast(null);
    setExpenses((items) => items.filter((item) => item.id !== id));
    try {
      await createFinanceRepository().removeExpense(id);
      showToast('success', 'Gasto eliminado.');
      await loadData();
    } catch (error) {
      setExpenses(previous);
      showError(error, 'No pudimos eliminar el gasto. Intentá de nuevo.');
    }
  }

  if (auth.isLoading) {
    return (
      <div className="app auth-app">
        <main className="main auth-main">
          <section className="card auth-card">Cargando sesión...</section>
        </main>
      </div>
    );
  }

  if (auth.isAuthEnabled && !auth.user) return <LoginView />;

  return (
    <div className={`${dark ? 'app dark' : 'app'}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand"><img src={dark ? darkLogoUrl : logoUrl} alt="" /><button className="sidebar-toggle" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Abrir barra' : 'Cerrar barra'}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
        <nav className="nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const label = isOperative && item.id === 'clientes' ? 'Trabajos' : isOperative && item.id === 'finanzas' ? 'Pagos' : item.label;
            return <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.id)} title={label}><Icon size={18} /><span className="nav-label">{label}</span></button>;
          })}
        </nav>
        <div className="profile-card">
          {auth.user && <small>{auth.user.email}</small>}
          <strong>{currentUser.name}</strong>
          {auth.user && <button className="ghost-btn" onClick={signOut}>Salir</button>}
        </div>
      </aside>

      <main className="main">
        {toast && <div className={`toast ${toast.tone}`}>{toast.text}</div>}
        <header className="topbar">
          <div><h1>{isOperative && active === 'clientes' ? 'Trabajos' : isOperative && active === 'finanzas' ? 'Pagos' : titleFor(active)}</h1></div>
          <div className="topbar-actions">
            {canInstallApp && <button className="theme-toggle" onClick={installApp}><Download size={18} /> Instalar aplicación</button>}
            <button className="theme-toggle" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={18} /> : <Moon size={18} />}{dark ? 'Modo claro' : 'Modo oscuro'}</button>
          </div>
        </header>
        <div className="view-shell" key={active}>
          {active === 'clientes' && (
            <ClientsView addClient={addClient} clientForm={clientForm} clients={visibleClients} isAdmin={isAdmin} onRemove={removeClient} onUpdate={updateClient} serviceById={serviceById} services={services} setClientForm={setClientForm} userById={userById} users={users} />
          )}

          {active === 'tareas' && (
            <TasksView addTask={addTask} currentUserId={currentUser.id} isAdmin={isAdmin} onRemoveTask={removeTask} onUpdateTask={updateTask} onToggleTask={toggleTask} setTaskForm={setTaskForm} taskForm={taskForm} tasks={visibleTasks} userById={userById} users={users} />
          )}

          {active === 'servicios' && (
            <ServicesView addService={addService} isAdmin={isAdmin} onRemove={removeService} onUpdate={updateService} serviceForm={serviceForm} services={services} setServiceForm={setServiceForm} />
          )}

          {active === 'calendario' && <CalendarView clients={visibleClients} serviceById={(id) => serviceById(id)?.name ?? 'Sin servicio'} userById={userById} />}

          {active === 'finanzas' && (
            <FinanceView addIncome={addIncome} allIncome={income} canViewAll={canViewAllFinance} currentUserId={currentUser.id} incomeForm={incomeForm} isAdmin={isAdmin} onRemoveIncome={removeIncome} onUpdateIncomeStatus={updateIncomeStatus} setIncomeForm={setIncomeForm} userIncome={userIncome} users={users} />
          )}

          {active === 'mensajes' && <MessagesView activeChatUser={activeChatUser} chatMessages={chatMessages} currentUser={currentUser} messageForm={messageForm} messages={messages} openConversation={openConversation} sendMessage={sendMessage} setMessageForm={setMessageForm} unreadMessages={unreadMessages} users={users} />}
          {active === 'usuarios' && <UsersView addRole={addRole} addUser={addUser} isAdmin={isAdmin} onUpdateUser={updateUser} roleForm={roleForm} roles={roles} setRoleForm={setRoleForm} setUserForm={setUserForm} setUsersPanel={setUsersPanel} userForm={userForm} users={users} usersPanel={usersPanel} />}
        </div>
      </main>
    </div>
  );
}

export default App;
