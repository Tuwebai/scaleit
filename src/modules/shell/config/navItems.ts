import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  DollarSign,
  MessageCircle,
  Users,
} from 'lucide-react';
import type { Section } from '../domain/section';

export const navItems = [
  { id: 'clientes' as Section, label: 'Clientes', icon: ClipboardList },
  { id: 'tareas' as Section, label: 'Tareas', icon: ClipboardList },
  { id: 'servicios' as Section, label: 'Servicios', icon: BriefcaseBusiness },
  { id: 'calendario' as Section, label: 'Calendario', icon: CalendarDays },
  { id: 'finanzas' as Section, label: 'Finanzas', icon: DollarSign },
  { id: 'mensajes' as Section, label: 'Mensajes', icon: MessageCircle },
  { id: 'usuarios' as Section, label: 'Usuarios', icon: Users },
];
