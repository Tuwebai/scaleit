export type ClientStatus = 'Sin empezar' | 'En proceso' | 'Terminado';

export type Client = {
  id: string;
  name: string;
  phone: string;
  value: number;
  serviceId: string;
  customServiceName: string;
  color: string;
  status: ClientStatus;
  start: string;
  delivery: string;
  assignedTo: string[];
  notes: string;
};
