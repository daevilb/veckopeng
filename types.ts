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

  // Login & identity
  pin: string;                // 4-digit PIN
  avatar: string;             // Emoji avatar

  // Payment
  /**
   * Generic payment handle:
   * - Swish: phone number (070..., +4670..., etc.)
   * - Venmo: @username
   * - Cash App: $cashtag
   */
  phoneNumber?: string;
  paymentMethod?: PaymentMethod;

  // Money
  currency?: Currency;        // e.g. 'SEK' (default)
  balance: number;            // Current unpaid allowance
  totalEarned: number;        // Lifetime cumulative earnings
  weeklyAllowance?: number;   // Expected weekly earnings goal
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  reward: number;
  assignedToId: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number | null;
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