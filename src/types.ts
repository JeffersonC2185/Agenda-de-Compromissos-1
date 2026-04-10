export interface User {
  id: number;
  email: string;
  nome: string;
  role: 'administrador' | 'cliente';
  ativo: boolean;
  dataNascimento?: string | null;
}

export interface Compromisso {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string; // ISO string
  hora: string;
  status: 'pendente' | 'concluido';
  retroativo: boolean;
  userId: number;
  user?: {
    nome: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  concluidos: number;
  pendentes: number;
  doDia: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
