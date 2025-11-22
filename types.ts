export type Role = 'parent' | 'child';
export type TaskStatus = 'pending' | 'waiting_for_approval' | 'completed';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
  avatar: string; // Emoji char
  phoneNumber?: string;
  balance: number; // Current unpaid allowance
  totalEarned: number; // Lifetime earnings
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  assignedToId: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
}

export interface AppState {
  users: User[];
  tasks: Task[];
  theme: 'light' | 'dark';
}

export const DEFAULT_STATE: AppState = {
  users: [],
  tasks: [],
  theme: 'light',
};