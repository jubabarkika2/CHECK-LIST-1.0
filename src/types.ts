export type ShiftType = 'abertura' | 'durante' | 'fechamento' | 'todos';

export type TaskCategory = 
  | 'Limpeza e Higiene'
  | 'Montagem & Setup'
  | 'Controle & Temperaturas'
  | 'Segurança & Validades'
  | 'Equipamentos'
  | 'Atendimento & Salão'
  | 'Outros';

export interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string; // e.g. 'emerald', 'amber', 'sky', 'rose', 'purple', 'indigo'
  description: string;
  isDefault?: boolean;
}

export interface TaskTemplate {
  id: string;
  sectorId: string;
  title: string;
  description?: string;
  requiresPhoto: boolean;
  shift: ShiftType;
  order: number;
  category: TaskCategory;
  criticalNotice?: string;
}

export interface TaskCompletion {
  taskId: string;
  completed: boolean;
  completedAt?: string;
  photoUrl?: string; // base64 or object URL stored in IndexedDB
  photoTimestamp?: string;
  notes?: string;
}

export interface ChecklistSubmission {
  id: string;
  submissionCode: string; // e.g. "CHK-20260827-8492"
  sectorId: string;
  sectorName: string;
  shift: ShiftType;
  responsibleName: string;
  responsibleRole?: string;
  startedAt: string;
  completedAt: string;
  totalTasks: number;
  completedTasksCount: number;
  photosCount: number;
  tasks: Array<{
    task: TaskTemplate;
    completion: TaskCompletion;
  }>;
  generalNotes?: string;
  managerReview?: {
    status: 'aprovado' | 'pendente' | 'ressalvas';
    reviewedAt?: string;
    feedback?: string;
  };
}

export interface ManagerSettings {
  managerPin: string;
  managerWhatsapp: string;
  managerName: string;
  restaurantName: string;
  requireStaffName: boolean;
  requireStaffPin?: boolean;
  autoWatermark: boolean;
  photoQuality: 'low' | 'medium' | 'high';
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  pin: string; // e.g. "1234"
  active: boolean;
  createdAt?: string;
}
