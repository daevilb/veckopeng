// -------------------------------
// TYPES FOR VECKOPENG v1.1
// -------------------------------

export type Role = 'parent' | 'child';

export type PaymentMethod = 'swish' | 'venmo' | 'cashapp';
export type Currency = 'SEK' | 'USD';

export type TaskStatus = 'pending' | 'waiting_for_approval' | 'completed';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
  avatar: string; // Emoji avatar
  phoneNumber?: string; // Swish, Venmo @username, CashApp $cashtag
  paymentMethod?: PaymentMethod; // Default handled in UI
  currency?: Currency; // Default handled in UI
  balance: number; // Current unpaid allowance
  totalEarned: number; // Lifetime cumulative earnings
}

export interface Task {
  id: string;
  title: string;
  description?: string;
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

// Default application state
export const DEFAULT_STATE: AppState = {
  users: [],
  tasks: [],
  theme: 'light',
};
