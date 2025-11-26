import React, { useState, useEffect } from 'react';
import { AppState, User, Task, PaymentMethod } from '../types';
import { Button } from './Button';
import { Setup } from './Auth';
import { Input } from './Input';
import { Card } from './Card';
import { useAppState } from './StateProvider';
import { approveTaskApi, createTaskApi, updateTaskApi } from '../services/api';
import { buildSwishPaymentUrl, buildVenmoPaymentUrl, buildCashAppPaymentUrl } from '../services/payments';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  X,
  AlertCircle,
  Wallet,
  CheckSquare,
  Smartphone,
  User as UserIcon,
  Trophy,
  Calendar,
  History,
  ExternalLink,
  Check,
  Pencil,
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { generateId } from '../utils/id';

// ================ Helpers ================

const isSameWeek = (date1: Date, date2: Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2); // <-- FIXAT: Använder parametern date2
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const day1 = d1.getDay() || 7;
  const day2 = d2.getDay() || 7;
  d1.setDate(d1.getDate() + 4 - day1);
  d2.setDate(d2.getDate() + 4 - day2);
  const year1 = d1.getFullYear();
  const week1 = Math.ceil((((d1.getTime() - new Date(year1, 0, 1).getTime()) / 86400000) + 1) / 7);
  const year2 = d2.getFullYear();
  const week2 = Math.ceil((((d2.getTime() - new Date(year2, 0, 1).getTime()) / 86400000) + 1) / 7);
  return year1 === year2 && week1 === week2;
};

// ================ Task Card Component (Internal) ================
// Komponenten ligger här för att undvika filberoende.

interface TaskCardProps {
  task: Task;
  assignedChild?: User;
  currentUser: User;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDelete: (taskId: string) => void;
}

const getStatusLabel = (status: Task['status']) => {
  switch (status) {
    case 'pending':
      return 'To do';
    case 'waiting_for_approval':
      return 'Waiting for approval';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

const getStatusBadgeClasses = (status: Task['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'waiting_for_approval':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignedChild,
  currentUser,
  onStatusChange,
  onDelete,
}) => {
  const isParent = currentUser.role === 'parent';
  const isAssignedToMe = task.assignedToId === currentUser.id;

  const canMarkAsDone = isAssignedToMe && task.status === 'pending';
  const canApprove = isParent && task.status === 'waiting_for_approval';
  const canSendBack = isParent && task.status === 'waiting_for_approval';
  const canDelete = isParent;
  
  const isDone = task.status === 'completed'; 

  const handleMarkDone = () => onStatusChange(task.id, 'waiting_for_approval');
  const handleApprove = () => onStatusChange(task.id, 'completed');
  const handleSendBack = () => onStatusChange(task.id, 'pending');

  return (
    <Card
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
        isDone
          ? 'opacity-80 hover:opacity-100 transition-opacity'
          : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
              task.status,
            )}`}
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            {getStatusLabel(task.status)}
          </span>
          {assignedChild && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              Assigned to {assignedChild.name}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {task.reward} kr
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
        {canMarkAsDone && (
          <Button variant="primary" onClick={handleMarkDone}>
            <CheckCircle className="w-4 h-4" />
            Mark as done
          </Button>
        )}
        {canApprove && (
          <Button variant="primary" onClick={handleApprove}>
            <CheckCircle className="w-4 h-4" />
            Approve & add to balance
          </Button>
        )}
        {canSendBack && (
          <Button variant="secondary" onClick={handleSendBack}>
            <X className="w-4 h-4" />
            Send back
          </Button>
        )}
        {canDelete && (
          <Button variant="ghost" onClick={() => onDelete(task.id)} aria-label="Delete task">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

// ================ Task Manager ================

interface TaskManagerProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onStateChange: (changes: Partial<AppState>) => void;
}

type TaskStatus = Task['status'];

export const TaskManager: React.FC<TaskManagerProps> = ({
  currentUser,
  users,
  tasks,
  onStateChange,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [childView, setChildView] = useState<'todo' | 'history'>('todo');

  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    reward: number;
    assignedToId: string;
  }>({
    title: '',
    description: '',
    reward: 20,
    assignedToId: '',
  });

  const isParent = currentUser.role === 'parent';
  const children = users.filter((u) => u.role === 'child');

  const myTasks = isParent 
    ? tasks 
    : tasks.filter((t) => t.assignedToId === currentUser.id);

  const activeTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'waiting_for_approval');
  
  const completedStatuses: TaskStatus[] = ['completed']; 
  const historyTasks = myTasks.filter(t => completedStatuses.includes(t.status));

  const totalEarnedAllTime = historyTasks.reduce((sum, t) => sum + t.reward, 0);
  
  const thisWeekTasks = historyTasks.filter(t => {
    const dateToCheck = t.completedAt ? new Date(t.completedAt * 1000) : new Date(t.createdAt);
    return isSameWeek(new Date(), dateToCheck);
  });
  const earnedThisWeek = thisWeekTasks.reduce((sum, t) => sum + t.reward, 0);

  const visibleTasks = isParent ? tasks : (childView === 'todo' ? activeTasks : historyTasks);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId) return;

    const task: Task = {
      id: generateId(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      reward: Number(newTask.reward) || 0,
      assignedToId: newTask.assignedToId,
      status: 'pending' as TaskStatus,
      createdAt: Date.now(),
    };

    try {
      const created = await createTaskApi({
        ...task,
        completedAt: null,
      });
      onStateChange({ tasks: [...tasks, created] });
      setIsCreating(false);
      setNewTask({ title: '', description: '', reward: 20, assignedToId: '' });
    } catch (err: any) {
      console.error('Failed to create task:', err);
      alert('Could not create task. Please try again.');
    }
  };

  const handleDelete = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    onStateChange({ tasks: updatedTasks });
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return;

    if (
      status === 'completed' &&
      currentUser.role === 'parent' &&
      existing.status === 'waiting_for_approval'
    ) {
      try {
        const { task: updatedTask, user: updatedUser } = await approveTaskApi(taskId); 
        
        const updatedTasks = tasks.map((t) =>
          t.id === taskId ? (updatedTask as Task) : t
        );
        
        const mergedUsers = users.map((u) => {
            return u.id === updatedUser.id ? (updatedUser as User) : u;
        });

        onStateChange({ tasks: updatedTasks, users: mergedUsers });
      } catch (err: any) {
        console.error('Failed to approve task:', err);
        alert('Could not approve task. Please try again.');
      }
      return;
    }

    try {
      const body: any = { status };
      if (status === 'completed') {
        body.completedAt = Math.floor(Date.now() / 1000);
      } else if (status === 'pending') {
        body.completedAt = null;
      }
      const updatedTask = await updateTaskApi(taskId, body);
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? (updatedTask as Task) : t
      );
      onStateChange({ tasks: updatedTasks });
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      alert('Could not update task. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isParent ? 'Tasks Manager' : 'My Tasks'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isParent
              ? 'Create, assign and approve tasks for your family.'
              : 'Complete tasks to earn your allowance!'}
          </p>
        </div>

        {!isParent && (
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start">
            <button
              onClick={() => setChildView('todo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                childView === 'todo'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              To Do ({activeTasks.length})
            </button>
            <button
              onClick={() => setChildView('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                childView === 'history'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              Progress
            </button>
          </div>
        )}

        {isParent && !isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus size={18} />
            New Task
          </Button>
        )}
      </div>

      {!isParent && childView === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-full shadow-sm">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 uppercase tracking-wide">
                  Total Earned
                </p>
                <p className="text-3xl font-extrabold text-yellow-900 dark:text-yellow-100">
                  {totalEarnedAllTime} kr
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Great job! You've completed {historyTasks.length} tasks in total.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-full shadow-sm">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                  This Week
                </p>
                <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100">
                  {earnedThisWeek} kr
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {thisWeekTasks.length} tasks finished this week. Keep it up!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isParent && isCreating && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <Card className="border-primary-200 dark:border-primary-900/50 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Task</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <Input
                  required
                  label="Title"
                  placeholder="e.g. Clean your room"
                  value={newTask.title}
                  onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Description (optional)"
                  placeholder="Add more details"
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  type="number"
                  min={0}
                  label="Reward (kr)"
                  value={newTask.reward}
                  onChange={(e) => setNewTask((t) => ({ ...t, reward: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assign to</label>
                <select
                  required
                  value={newTask.assignedToId}
                  onChange={(e) => setNewTask((t) => ({ ...t, assignedToId: e.target.value }))}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 outline-none"
                >
                  <option value="">Choose a family member</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 flex items-end justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTask.title || !newTask.assignedToId}><CheckCircle size={18} /> Save Task</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {visibleTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          {childView === 'history' ? (
             <>
               <History className="w-10 h-10 text-gray-300 dark:text-gray-600" />
               <h3 className="font-semibold text-gray-800 dark:text-gray-100">No history yet</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Complete tasks and ask your parent to approve them to see them here!</p>
             </>
          ) : (
             <>
               <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" />
               <h3 className="font-semibold text-gray-800 dark:text-gray-100">No tasks found</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 {isParent ? 'Create a task and assign it to one of your children.' : 'You have no active tasks right now. Great job!'}
               </p>
             </>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {!isParent && childView === 'history' && (
             <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4">Completed History</h3>
          )}
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignedChild={users.find((u) => u.id === task.assignedToId)}
              currentUser={currentUser}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ================ Home Dashboard ================

interface HomeDashboardProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onUpdateUsers: (users: User[]) => void;
  onNavigate: (tab: string) => void;
}

interface PaymentModalState {
  childId: string;
  childName: string;
  amount: number;
  url: string;
  methodLabel: string;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  users,
  tasks,
  onUpdateUsers,
  onNavigate,
}) => {
  const isParent = currentUser.role === 'parent';
  const { reload } = useAppState();

  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'verify'>('confirm');

  // Initiera betalning (öppna modal)
  const initiatePayment = (childId: string) => {
    const child = users.find((u) => u.id === childId);
    if (!child || (child.balance ?? 0) <= 0) return;

    const method = child.paymentMethod ?? 'swish';
    if (!child.phoneNumber) {
      alert(`Please add a payment handle for ${child.name} in the Family tab before paying.`);
      return;
    }

    const amount = child.balance ?? 0;
    let url = '';
    let label = 'Swish';

    if (method === 'swish') {
       if (!/^[0-9+ ]+$/.test(child.phoneNumber)) {
        alert('Please enter a valid Swish phone number (digits and + only).');
        return;
      }
      url = buildSwishPaymentUrl({ phoneNumber: child.phoneNumber, amount, message: 'Veckopeng' });
      label = 'Swish';
    } else if (method === 'venmo') {
      url = buildVenmoPaymentUrl({ username: child.phoneNumber, amount, note: 'Veckopeng' });
      label = 'Venmo';
    } else if (method === 'cashapp') {
      url = buildCashAppPaymentUrl({ cashtag: child.phoneNumber, amount, note: 'Veckopeng' });
      label = 'Cash App';
    }

    setPaymentModal({
      childId: child.id,
      childName: child.name,
      amount,
      url,
      methodLabel: label
    });
    setPaymentStep('confirm');
  };

  // Nollställ saldo (anropas när betalning är klar)
  const completePayment = () => {
    if (!paymentModal) return;
    const updated = users.map((u) => u.id === paymentModal.childId ? { ...u, balance: 0 } : u);
    onUpdateUsers(updated);
    setPaymentModal(null);
  };

  if (!isParent) {
    const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
    const pending = myTasks.filter((t) => t.status === 'pending').length;
    const waiting = myTasks.filter((t) => t.status === 'waiting_for_approval').length;
    
    const completedStatuses: Task['status'][] = ['completed']; 
    const done = myTasks.filter(t => completedStatuses.includes(t.status)).length; 

    // --- NY LOGIK FÖR INTJÄNING (EARNINGS) ---
    const historyTasks = myTasks.filter(t => completedStatuses.includes(t.status));
    const totalEarnedAllTime = historyTasks.reduce((sum, t) => sum + t.reward, 0);
    
    const thisWeekTasks = historyTasks.filter(t => {
      const dateToCheck = t.completedAt ? new Date(t.completedAt * 1000) : new Date(t.createdAt);
      return isSameWeek(new Date(), dateToCheck);
    });
    const earnedThisWeek = thisWeekTasks.reduce((sum, t) => sum + t.reward, 0);
    // ----------------------------------------

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Hi {currentUser.name} 👋</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here is your week at a glance.</p>
        </div>

        {/* --- EARNINGS CARDS START --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-full shadow-sm">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 uppercase tracking-wide">
                  Total Earned
                </p>
                <p className="text-3xl font-extrabold text-yellow-900 dark:text-yellow-100">
                  {totalEarnedAllTime} kr
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-full shadow-sm">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                  This Week
                </p>
                <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100">
                  {earnedThisWeek} kr
                </p>
              </div>
            </div>
          </Card>
        </div>
        {/* --- EARNINGS CARDS END --- */}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => onNavigate('tasks')}>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"><Clock className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{pending}</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Tasks to do</p><p className="text-sm text-gray-500 dark:text-gray-400">Waiting for you to complete.</p></div>
          </Card>

          <Card className="flex flex-col gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => onNavigate('tasks')}>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"><AlertCircle className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{waiting}</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Waiting for approval</p><p className="text-sm text-gray-500 dark:text-gray-400">Your parent will review these.</p></div>
          </Card>

          <Card className="flex flex-col gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => onNavigate('tasks')}>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"><CheckCircle className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{done}</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Completed tasks</p><p className="text-sm text-gray-500 dark:text-gray-400">Great job!</p></div>
          </Card>
        </div>

        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Go to your tasks</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">See details and mark tasks as done when you complete them.</p>
          </div>
          <Button onClick={() => onNavigate('tasks')}><CheckSquare className="w-4 h-4" /> Open tasks</Button>
        </Card>
      </div>
    );
  }

  // Parent view
  const children = users.filter((u) => u.role === 'child');
  const totalBalance = children.reduce((sum, c) => sum + (c.balance ?? 0), 0);
  const waitingTasks = tasks.filter((t) => t.status === 'waiting_for_approval');

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back, {currentUser.name} 👋</h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of your family’s chores, allowance and approvals.</p>
            <div className="h-5 flex items-center">
              {syncState === 'syncing' && <p className="text-xs text-blue-500 dark:text-blue-300 animate-pulse font-medium">Syncing...</p>}
              {syncState === 'success' && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300 font-medium">
                  <CheckCircle className="w-3 h-3" /> Updated
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"><Wallet className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalBalance} kr</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Total pending payouts</p><p className="text-sm text-gray-500 dark:text-gray-400">Sum of all childrens’ current balances.</p></div>
          </Card>

          <Card className="flex flex-col gap-3 cursor-pointer" onClick={() => onNavigate('tasks')}>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"><AlertCircle className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{waitingTasks.length}</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Waiting approvals</p><p className="text-sm text-gray-500 dark:text-gray-400">Tasks that children have sent for approval.</p></div>
          </Card>

          <Card className="flex flex-col gap-3 cursor-pointer" onClick={() => onNavigate('family')}>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"><UserIcon className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{children.length}</span>
            </div>
            <div><p className="font-semibold text-gray-900 dark:text-white">Children</p><p className="text-sm text-gray-500 dark:text-gray-400">Manage family members and phone numbers.</p></div>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Children overview</h3>
          {children.length === 0 ? (
            <Card className="text-center py-8"><p className="text-sm text-gray-500 dark:text-gray-400">No children added yet. Go to the Family tab to add your first child.</p></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child) => {
                const childTasks = tasks.filter((t) => t.assignedToId === child.id);
                const pending = childTasks.filter((t) => t.status === 'pending').length;
                const waiting = childTasks.filter((t) => t.status === 'waiting_for_approval').length;
                
                const completedStatuses: Task['status'][] = ['completed']; 
                const completed = childTasks.filter(t => completedStatuses.includes(t.status)).length; 


                return (
                  <Card key={child.id} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{child.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Child</p>
                        {child.phoneNumber && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{child.phoneNumber}</p>}
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white"><DollarSign className="w-4 h-4" /> {child.balance ?? 0} kr</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current balance</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"><Clock className="w-3 h-3 mr-1" /> {pending} to do</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"><AlertCircle className="w-3 h-3 mr-1" /> {waiting} waiting</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"><CheckCircle className="w-3 h-3 mr-1" /> {completed} done</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                      <Button variant="secondary" onClick={() => onNavigate('tasks')}><CheckSquare className="w-4 h-4" /> View tasks</Button>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const method = child.paymentMethod ?? 'swish';
                          const hasHandle = !!child.phoneNumber;
                          const hasPositiveBalance = (child.balance ?? 0) > 0;
                          let label = 'Pay'; let title = ''; let canPay = hasHandle && hasPositiveBalance;
                          if (method === 'swish') {
                            label = 'Swish'; title = hasHandle ? 'Open Swish' : 'Requires Swish number';
                            if (!child.phoneNumber || !/^[0-9+ ]+$/.test(child.phoneNumber)) { canPay = false; title = 'Invalid Swish number'; }
                          } else if (method === 'venmo') { label = 'Venmo'; title = hasHandle ? 'Open Venmo' : 'Requires Venmo username'; }
                          else if (method === 'cashapp') { label = 'Cash App'; title = hasHandle ? 'Open Cash App' : 'Requires Cash App tag'; }
                          if (!title) title = 'Set a payment method first.';
                          return <Button variant="primary" disabled={!canPay} onClick={() => initiatePayment(child.id)} title={title}><Smartphone className="w-4 h-4" /> {label}</Button>;
                        })()}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setPaymentModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2 pb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                paymentStep === 'confirm' 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {paymentStep === 'confirm' ? (
                  <Smartphone className="w-8 h-8" />
                ) : (
                  <Check className="w-8 h-8" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {paymentStep === 'confirm' ? 'Send Payment' : 'Did it work?'}
              </h3>
              
              {paymentStep === 'confirm' ? (
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Open {paymentModal.methodLabel} to send <strong className="text-gray-900 dark:text-white">{paymentModal.amount} kr</strong> to {paymentModal.childName}?
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  If the payment was successful, we can reset {paymentModal.childName}'s balance to 0.
                </p>
              )}

              <div className="space-y-3">
                {paymentStep === 'confirm' ? (
                  <>
                    <Button 
                      size="lg" 
                      fullWidth 
                      className="bg-[#0D0D0D] dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black"
                      onClick={() => {
                        window.location.href = paymentModal.url;
                        setPaymentStep('verify');
                      }}
                    >
                      Open {paymentModal.methodLabel} App
                      <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                    
                    <button 
                      onClick={() => setPaymentStep('verify')}
                      className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 underline"
                    >
                      I paid manually (or on desktop)
                    </button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      fullWidth 
                      onClick={completePayment}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Yes, reset balance to 0
                    </Button>
                    <Button 
                      variant="ghost" 
                      fullWidth
                      onClick={() => setPaymentModal(null)}
                    >
                      No, keep balance
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

// ================ Family Manager ================

interface FamilyManagerProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export const FamilyManager: React.FC<FamilyManagerProps> = ({
  users,
  onUpdateUsers,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPayment, setEditPayment] = useState<PaymentMethod>('swish');

  // Populate form when editing starts
  useEffect(() => {
    if (editingUser) {
      setEditName(editingUser.name);
      setEditPin(editingUser.pin);
      setEditPhone(editingUser.phoneNumber || '');
      setEditPayment(editingUser.paymentMethod || 'swish');
    }
  }, [editingUser]);

  const handleAddUser = (newUser: User) => {
    // Check if phone number already exists
    if (newUser.phoneNumber) {
      const existing = users.find(u => u.phoneNumber === newUser.phoneNumber);
      if (existing) {
        const confirm = window.confirm(
          `Number ${newUser.phoneNumber} is already used by ${existing.name}. Do you want to add this user anyway?`
        );
        if (!confirm) return;
      }
    }
    onUpdateUsers([...users, newUser]);
    setIsAdding(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editName,
          pin: editPin,
          phoneNumber: editPhone || undefined,
          paymentMethod: u.role === 'child' ? editPayment : undefined,
          updatedAt: Date.now()
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}? This cannot be undone.`)) {
      const updatedUsers = users.filter(u => u.id !== userId);
      onUpdateUsers(updatedUsers);
    }
  };

  // Find duplicate phone number user (if any) during edit
  const duplicatePhoneUser = editPhone 
    ? users.find(u => u.phoneNumber === editPhone && u.id !== editingUser?.id)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Family members</h2><p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage parents, children and phone numbers.</p></div>
        {!isAdding && <Button onClick={() => setIsAdding(true)}><UserIcon size={18} /> Add member</Button>}
      </div>

      {isAdding && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 max-w-md mx-auto mb-8">
          <Setup isFirstRun={false} onComplete={handleAddUser} />
          <div className="text-center mt-4"><Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button></div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit {editingUser.name}</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input 
                label="Name" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                required 
              />
              
              <div>
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                  PIN Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center"><Lock className="w-4 h-4 text-gray-400" /></div>
                  <input
                    type="text" 
                    maxLength={4}
                    pattern="\d{4}"
                    value={editPin}
                    onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {editingUser.role === 'child' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['swish', 'venmo', 'cashapp'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEditPayment(m)}
                          className={`px-2 py-1.5 text-xs font-medium rounded-lg capitalize border transition-colors ${
                            editPayment === m
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Input 
                      label={editPayment === 'swish' ? 'Phone Number' : editPayment === 'venmo' ? 'Venmo Username' : '$Cashtag'}
                      value={editPhone} 
                      onChange={e => setEditPhone(e.target.value)} 
                      placeholder={editPayment === 'swish' ? '070...' : '@username'}
                      className={duplicatePhoneUser ? 'border-red-500 focus:ring-red-200' : ''}
                    />
                    {duplicatePhoneUser && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                        <AlertTriangle className="w-3 h-3" />
                        This number is already used by {duplicatePhoneUser.name}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" fullWidth className="mt-2">Save Changes</Button>
            </form>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {users.map((u) => (
          <Card key={u.id} className="flex items-start justify-between gap-4 group relative">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-semibold">{u.name.split(' ').map((p) => p[0]).join('').toUpperCase()}</div>
                <div><p className="font-semibold text-gray-900 dark:text-white">{u.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{u.role === 'parent' ? 'Parent' : 'Child'}</p></div>
              </div>
              {u.phoneNumber && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">{u.phoneNumber}</p>}
              {typeof u.balance === 'number' && u.role === 'child' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 inline-flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance: <span className="font-medium text-gray-900 dark:text-white">{u.balance} kr</span></p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${u.role === 'parent' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'}`}>{u.role}</span>
              
              <div className="flex gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingUser(u)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Edit member"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteUser(u.id, u.name)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};