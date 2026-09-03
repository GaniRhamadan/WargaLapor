import { User } from './auth';

export interface Officer {
  id: number;
  user_id: number;
  department: string;
  unit?: string | null;
  area_coverage?: string | null;
  active_tasks_count: number;
  completed_tasks_count: number;
  status: 'available' | 'busy' | 'offline';
  user?: User;
}
