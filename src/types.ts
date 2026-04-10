export interface Compromisso {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string; // ISO string
  hora: string;
  status: 'pendente' | 'concluido';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  concluidos: number;
  pendentes: number;
  doDia: number;
}
