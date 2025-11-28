import React, { useState, useEffect } from 'react';
import { AppState, User, Task, PaymentMethod, Role, Currency } from '../types';
import { Button } from './Button';
import { Setup } from './Auth';
import { Input } from './Input';
import { Card } from './Card';
import { useAppState } from './StateProvider';
import {
  approveTaskApi,
  createTaskApi,
  updateTaskApi,
  createUserApi,
  updateUserApi,
} from '../services/api';
import {
  buildSwishPaymentUrl,
  buildVenmoPaymentUrl,
  buildCashAppPaymentUrl,
  buildPaypalPaymentUrl,
} from '../services/payments';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Smartphone,
  Users,
  Calendar,
  PiggyBank,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Trophy,
  Pencil,
  Trash2,
  UserPlus,
  Coins,
} from 'lucide-react';

type TaskStatus = Task['status'];

// Helpers
function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;

  d.setDate(d.getDate() - diffToMonday);
  const monday = new Date(d);
  const sunday = new Date(d);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} – ${sunday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPreviousWeek(date: Date) {
  const d = getWeekStart(date);
  d.setDate(d.getDate() - 7);
  return d;
}

function getNextWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d;
}

// Helper to check if two dates are in the same ISO week
function isSameWeek(d1: Date, d2: Date = new Date()): boolean {
  const date1 = new Date(d1.getTime());
  const date2 = new Date(d2.getTime());

  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  const day1 = date1.getDay() || 7;
  const day2 = date2.getDay() || 7;

  date1.setDate(date1.getDate() + 4 - day1);
  date2.setDate(date2.getDate() + 4 - day2);

  const year1 = date1.getFullYear();
  const week1 = Math.ceil(
    ((date1.getTime() - new Date(year1, 0, 1).getTime()) / 86400000 + 1) / 7,
  );
  const year2 = date2.getFullYear();
  const week2 = Math.ceil(
    ((date2.getTime() - new Date(year2, 0, 1).getTime()) / 86400000 + 1) / 7,
  );

  return year1 === year2 && week1 === week2;
}

const getStatusBadgeClasses = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'waiting_for_approval':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

// ============================================
// Setup Wrapper (used by App.tsx)
// ============================================

export const SetupWrapper: React.FC = () => {
  const { state, reload } = useAppState();
  const hasUsers = state.users && state.users.length > 0;

  const handleComplete = async () => {
    try {
      await reload();
    } catch (err) {
      console.error('Failed to reload after setup', err);
    }
  };

  if (hasUsers) {
    // Once at least one user exists, don't show setup anymore
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Setup onComplete={handleComplete} isFirstRun={!hasUsers} />
    </div>
  );
};

// ============================================
// Task List & Actions
// ============================================

interface TaskListProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onUpdateTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  users,
  currentUser,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const isParent = currentUser.role === 'parent';

  const getAssigneeName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || 'Unknown';

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingReward, setEditingReward] = useState(0);
  const [editingAssigneeId, setEditingAssigneeId] = useState('');

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description || '');
    setEditingReward(task.reward);
    setEditingAssigneeId(task.assignedToId);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
    setEditingDescription('');
    setEditingReward(0);
    setEditingAssigneeId('');
  };

  const saveEdit = async () => {
    if (!editingTaskId) return;

    const updatedTask: Task = {
      ...tasks.find((t) => t.id === editingTaskId)!,
      title: editingTitle.trim(),
      description: editingDescription.trim(),
      reward: editingReward,
      assignedToId: editingAssigneeId,
    };

    try {
      const saved = await updateTaskApi(updatedTask.id, updatedTask);
      onUpdateTask(saved);
      cancelEdit();
    } catch (err) {
      console.error('Failed to update task', err);
      alert('Could not update task. Please try again.');
    }
  };

  const renderActions = (task: Task) => {
    const isOwnTask = task.assignedToId === currentUser.id;

    if (currentUser.role === 'child') {
      if (task.status === 'pending' && isOwnTask) {
        return (
          <button
            onClick={() => onStatusChange(task.id, 'waiting_for_approval')}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Mark done
          </button>
        );
      }

      if (task.status === 'waiting_for_approval') {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Waiting for approval
          </span>
        );
      }

      if (task.status === 'completed') {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      }

      return null;
    }

    // Parent actions
    if (task.status === 'waiting_for_approval') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onStatusChange(task.id, 'completed')}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => onStatusChange(task.id, 'pending')}
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300"
          >
            <X className="w-3.5 h-3.5" />
            Deny
          </button>
        </div>
      );
    }

    if (task.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }

    return null;
  };

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        No tasks yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const assigneeName = getAssigneeName(task.assignedToId);
        const isEditing = editingTaskId === task.id;

        return (
          <Card key={task.id} className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <>
                    <Input
                      label="Title"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                    />
                    <Input
                      label="Description"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {assigneeName}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px]\tfont-medium ${getStatusBadgeClasses(
                      task.status,
                    )}`}
                  >
                    {task.status === 'pending' && (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </>
                    )}
                    {task.status === 'waiting_for_approval' && (
                      <>
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Waiting for approval
                      </>
                    )}
                    {task.status === 'completed' && (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <DollarSign className="h-3 w-3" />
                    {task.reward} kr
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span>Created</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {formatDate(new Date(task.createdAt * 1000))}
                    </span>
                    <span className="hidden text-gray-400 md:inline">·</span>
                    <span className="hidden md:inline">
                      {formatTime(new Date(task.createdAt * 1000))}
                    </span>
                  </span>
                  {task.completedAt && (
                    <span className="inline-flex items-center gap-1">
                      <span>Completed</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {formatDate(new Date(task.completedAt * 1000))}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-col items-end gap-2 md:mt-0 md:min-w-[220px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.reward} kr
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    reward
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isParent && (
                    <>
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(task)}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {onDeleteTask && (
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {renderActions(task)}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================
// Task Manager (Parent + Child views)
// ============================================

interface TaskManagerProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onStateChange: (partial: Partial<AppState>) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  currentUser,
  users,
  tasks,
  onStateChange,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: 10,
    assignedToId: '',
  });
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [childView, setChildView] = useState<'todo' | 'history'>('todo');

  const isParent = currentUser.role === 'parent';

  const familyChildren = users.filter((u) => u.role === 'child');
  useEffect(() => {
    if (isParent && !selectedChildId && familyChildren.length > 0) {
      setSelectedChildId(familyChildren[0].id);
    }
  }, [isParent, selectedChildId, familyChildren]);

  const filteredTasks = tasks.filter((task) => {
    if (isParent) {
      if (selectedChildId && task.assignedToId !== selectedChildId) {
        return false;
      }
    } else {
      if (task.assignedToId !== currentUser.id) return false;
    }

    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const activeTasks = filteredTasks.filter(
    (t) => t.status === 'pending' || t.status === 'waiting_for_approval',
  );
  const historyTasks = filteredTasks.filter((t) => t.status === 'completed');

  const thisWeekTasks = historyTasks.filter((t) => {
    const dateToCheck = t.completedAt
      ? new Date(t.completedAt * 1000)
      : new Date(t.createdAt);
    return isSameWeek(new Date(), dateToCheck);
  });

  const earnedThisWeek = thisWeekTasks.reduce((sum, t) => sum + t.reward, 0);

  const visibleTasks = isParent
    ? tasks
    : childView === 'todo'
    ? activeTasks
    : historyTasks;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId) return;

    const taskPayload = {
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      reward: Number(newTask.reward),
      assignedToId: newTask.assignedToId,
    };

    try {
      const savedTask = await createTaskApi(taskPayload);
      onStateChange({ tasks: [...tasks, savedTask] });
      setNewTask({
        title: '',
        description: '',
        reward: 10,
        assignedToId: isParent ? newTask.assignedToId : currentUser.id,
      });
    } catch (err) {
      console.error('Failed to create task', err);
      alert('Could not create task. Please try again.');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      if (isParent && status === 'completed') {
        // Parent approving a task: use approveTaskApi so balance/totalEarned are updated
        const {
          task: updatedTask,
          user: updatedUser,
        } = await approveTaskApi(taskId, true);

        const newTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
        const newUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));

        onStateChange({ tasks: newTasks, users: newUsers });
      } else {
        // Child marking done (waiting_for_approval) or parent resetting/denying: simple status update
        const patch: Partial<Pick<Task, 'status' | 'title' | 'description' | 'reward'>> & {
          completedAt?: number | null;
        } = { status };

        if (status === 'completed') {
          patch.completedAt = Math.floor(Date.now() / 1000);
        } else if (status === 'pending') {
          patch.completedAt = null;
        }

        const updatedTask = await updateTaskApi(taskId, patch);
        const newTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
        onStateChange({ tasks: newTasks });
      }
    } catch (err) {
      console.error('Failed to update task status', err);
      alert('Could not update task. Please try again.');
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const newTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    onStateChange({ tasks: newTasks });
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter((t) => t.id !== taskId);
    onStateChange({ tasks: newTasks });
  };

  if (isParent) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Filter tasks
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose child and status to focus your view.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                <option value="">All children</option>
                {familyChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
                {(['all', 'pending', 'waiting_for_approval', 'completed'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        filterStatus === status
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-primary-600 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {status === 'all'
                        ? 'All'
                        : status === 'pending'
                        ? 'Pending'
                        : status === 'waiting_for_approval'
                        ? 'Waiting'
                        : 'Completed'}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredTasks.length}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Total tasks
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Across selected children.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  filteredTasks.filter(
                    (t) => t.status === 'waiting_for_approval',
                  ).length
                }
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Needs approval
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for your review.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {earnedThisWeek} kr
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Earned this week
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Based on completed tasks.
              </p>
            </div>
          </Card>
        </div>

        {/* Create task */}
        <Card className="p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Create new task
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <ShieldCheck className="h-3 w-3" />
                Parents only
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Task title"
                placeholder="Clean your room"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <Input
                label="Description (optional)"
                placeholder="Make bed, tidy floor, put toys away"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    Reward
                  </label>
                  <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      kr
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={newTask.reward}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          reward: Number(e.target.value),
                        }))
                      }
                      className="h-6 flex-1 border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                    Assign to
                  </label>
                  <select
                    className="block w-full rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={newTask.assignedToId}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        assignedToId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select child</option>
                    {familyChildren.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tasks will appear in your child&apos;s list immediately.
              </p>
              <Button type="submit">
                <Plus className="mr-1.5 h-4 w-4" />
                Save task
              </Button>
            </div>
          </form>
        </Card>

        {/* Task list */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              All tasks
            </h3>
          </div>
          <TaskList
            tasks={visibleTasks}
            users={users}
            currentUser={currentUser}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </Card>
      </div>
    );
  }

  // Child view
  const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
  const pending = myTasks.filter((t) => t.status === 'pending').length;
  const waiting = myTasks.filter((t) => t.status === 'waiting_for_approval').length;

  const completedStatuses: Task['status'][] = ['completed'];
  const done = myTasks.filter((t) => completedStatuses.includes(t.status)).length;

  const historyTasksChild = myTasks.filter((t) => completedStatuses.includes(t.status));
  const totalEarnedAllTime = historyTasksChild.reduce((sum, t) => sum + t.reward, 0);

  const thisWeekTasksChild = historyTasksChild.filter((t) => {
    const dateToCheck = t.completedAt
      ? new Date(t.completedAt * 1000)
      : new Date(t.createdAt);
    return isSameWeek(new Date(), dateToCheck);
  });

  const earnedThisWeekChild = thisWeekTasksChild.reduce(
    (sum, t) => sum + t.reward,
    0,
  );

  const weeklyAllowance = currentUser.weeklyAllowance ?? 0;
  const allowanceProgress =
    weeklyAllowance > 0 ? Math.min(earnedThisWeekChild / weeklyAllowance, 1) : 0;
  const extraRewards =
    weeklyAllowance > 0 && earnedThisWeekChild > weeklyAllowance
      ? earnedThisWeekChild - weeklyAllowance
      : 0;

  const childActiveTasks = myTasks.filter(
    (t) => t.status === 'pending' || t.status === 'waiting_for_approval',
  );
  const childHistoryTasks = myTasks.filter((t) => t.status === 'completed');

  const childVisibleTasks =
    childView === 'todo' ? childActiveTasks : childHistoryTasks;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Hi {currentUser.name} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here is your week at a glance.
        </p>
      </div>

      {/* Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/50">
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

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100/80 dark:from-indigo-900/40 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/60 dark:bg-black/20 rounded-full shadow-sm">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                This Week
              </p>
              <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100">
                {earnedThisWeekChild} kr
              </p>
            </div>
          </div>
        </Card>
      </div>

      {weeklyAllowance > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200">
                <PiggyBank className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-200">
                  Weekly allowance
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {earnedThisWeekChild} / {weeklyAllowance} kr
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-pink-500 dark:bg-pink-400"
                    style={{ width: `${allowanceProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {extraRewards > 0 && (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200">
                  <Coins className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                    Extra rewards
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {extraRewards} kr
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You earned more than your weekly allowance – nice work!
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {pending}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Pending tasks
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Waiting for you to complete.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {waiting}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Waiting for approval
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your parent will check these soon.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {done}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Completed tasks
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Great job!
            </p>
          </div>
        </Card>
      </div>

      {/* Child task list */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Your tasks
          </h3>
          <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setChildView('todo')}
              className={`rounded-full px-3 py-1 font-medium transition ${
                childView === 'todo'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-primary-600 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              To do
            </button>
            <button
              type="button"
              onClick={() => setChildView('history')}
              className={`rounded-full px-3 py-1 font-medium transition ${
                childView === 'history'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-primary-600 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              History
            </button>
          </div>
        </div>
        <TaskList
          tasks={childVisibleTasks}
          users={users}
          currentUser={currentUser}
          onUpdateTask={handleUpdateTask}
          onStatusChange={handleStatusChange}
        />
      </Card>
    </div>
  );
};

// ============================================
// Family Manager
// ============================================

interface FamilyManagerProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const ChildEditRow: React.FC<{
  child: User;
  onUpdate: (id: string, updates: Partial<User>) => void;
}> = ({ child, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState(child.phoneNumber || '');
  const [balance, setBalance] = useState(child.balance ?? 0);
  const [totalEarned, setTotalEarned] = useState(child.totalEarned ?? 0);
  const [weeklyAllowance, setWeeklyAllowance] = useState<number>(
    child.weeklyAllowance ?? 0,
  );
  const [currency, setCurrency] = useState<Currency>(child.currency || 'SEK');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    child.paymentMethod || 'swish',
  );

  // NOTE: we intentionally do NOT resync local state from props here,
  // to avoid overwriting user edits while typing.

  const handleBlur = (field: keyof User, value: any) => {
    if (value !== child[field]) {
      onUpdate(child.id, { [field]: value });
    }
  };

  return (
    <Card className="p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-100 flex items-center justify-center text-lg">
            {child.avatar || '👤'}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              {child.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {child.phoneNumber || 'No payment details set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Details</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Phone / Payment identifier"
              placeholder="07X-XXX XX XX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onBlur={() => handleBlur('phoneNumber', phoneNumber)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Default payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setPaymentMethod(val);
                  handleBlur('paymentMethod', val);
                }}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="swish">Swish</option>
                <option value="venmo">Venmo</option>
                <option value="cashapp">Cash App</option>
                <option value="paypal">PayPal.me</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              label="Current balance (kr)"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value) || 0)}
              onBlur={() => handleBlur('balance', balance)}
            />
            <Input
              type="number"
              label="Total earned (kr)"
              value={totalEarned}
              onChange={(e) => setTotalEarned(Number(e.target.value) || 0)}
              onBlur={() => handleBlur('totalEarned', totalEarned)}
            />
            <Input
              type="number"
              label="Weekly allowance (kr/week)"
              value={weeklyAllowance}
              onChange={(e) => setWeeklyAllowance(Number(e.target.value) || 0)}
              onBlur={() => handleBlur('weeklyAllowance', weeklyAllowance)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => {
                const val = e.target.value as Currency;
                setCurrency(val);
                handleBlur('currency', val);
              }}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="SEK">SEK</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      )}
    </Card>
  );
};

export const FamilyManager: React.FC<FamilyManagerProps> = ({
  users,
  onUpdateUsers,
}) => {
  const parents = users.filter((u) => u.role === 'parent');
  const children = users.filter((u) => u.role === 'child');

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'child'>('child');
  const [newMemberAvatar, setNewMemberAvatar] = useState('👤'); // avatar default

  const avatarOptions = [
    '👨‍👩‍👧',
    '🦸‍♂️',
    '🦸‍♀️',
    '🧚',
    '🧞',
    '🦊',
    '🦄',
    '🦖',
    '⚽️',
    '🎨',
    '🎮',
    '🎸',
    '🤖',
    '🦁',
    '🐵',
    '🐼',
  ];

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updatedUser = await updateUserApi(id, updates);
      const updatedUsers = users.map((u) => (u.id === id ? updatedUser : u));
      onUpdateUsers(updatedUsers);
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newMemberName.trim();
    const trimmedPin = newMemberPin.trim();

    if (!trimmedName || !trimmedPin) {
      alert('Please enter a name and a 4-digit PIN.');
      return;
    }

    try {
      const userPayload = {
        name: trimmedName,
        role: newMemberRole,
        pin: trimmedPin,
        avatar: newMemberAvatar,
        phoneNumber: '',
        paymentMethod: 'swish' as PaymentMethod,
        currency: 'SEK' as const,
        balance: 0,
        totalEarned: 0,
        weeklyAllowance: 0,
      };

      const savedUser = await createUserApi(userPayload);
      onUpdateUsers([...users, savedUser]);

      setNewMemberName('');
      setNewMemberPin('');
      setNewMemberRole('child');
      setNewMemberAvatar('👤');
      setIsAddingMember(false);
    } catch (err) {
      console.error('Failed to create family member', err);
      alert('Could not create family member. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add member form */}
      {isAddingMember && (
        <Card className="p-4 border-dashed border-primary-300 dark:border-primary-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Add family member
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create a parent or child account for your family.
          </p>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Name"
                placeholder="William"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <Input
                label="PIN (4 digits)"
                placeholder="1234"
                maxLength={4}
                value={newMemberPin}
                onChange={(e) => setNewMemberPin(e.target.value)}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                  Role
                </label>
                <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('parent')}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      newMemberRole === 'parent'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-primary-600 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('child')}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      newMemberRole === 'child'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-primary-600 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Child
                  </button>
                </div>
              </div>
            </div>

            {/* Avatar Picker for new member */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">
                Choose avatar
              </label>
              <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                {avatarOptions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setNewMemberAvatar(a)}
                    className={`text-2xl h-10 w-full flex items-center justify-center rounded-xl border transition-all ${
                      newMemberAvatar === a
                        ? 'bg-white dark:bg-gray-700 shadow-md ring-2 ring-primary-500 scale-110'
                        : 'opacity-70 hover:opacity-100 border-transparent'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <Button type="submit">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Save member
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Parents */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Parents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage who can create tasks and approve rewards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingMember(true)}
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add member
          </button>
        </div>

        <div className="space-y-2">
          {parents.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No parents added yet. Create one to manage tasks.
            </p>
          )}
          {parents.map((parent) => (
            <Card key={parent.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-100 flex items-center justify-center text-lg">
                  {parent.avatar || '👤'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {parent.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Parent · can approve tasks and send payments
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* Children */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Children
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Set up payment details and balances for each child.
        </p>
        <div className="space-y-3">
          {children.map((child) => (
            <ChildEditRow key={child.id} child={child} onUpdate={handleUpdateUser} />
          ))}
        </div>
      </section>
    </div>
  );
};

// ============================================
// Home Dashboard
// ============================================

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

  const initiatePayment = (childId: string) => {
    const child = users.find((u) => u.id === childId);
    if (!child) return;

    if (!child.paymentMethod || !child.phoneNumber) {
      alert(
        `Please set a payment method and identifier for ${child.name} in the Family tab before paying.`,
      );
      return;
    }

    if (!child.balance || child.balance <= 0) {
      alert(`${child.name} has no pending allowance to pay.`);
      return;
    }

    const method = child.paymentMethod as PaymentMethod;

    if (!child.phoneNumber) {
      alert(
        `Please add a payment handle for ${child.name} in the Family tab before paying.`,
      );
      return;
    }

    const amount = child.balance ?? 0;
let url = '';
let label: string = 'Swish'; // CHANGED (explicit type, but behaviour same)

if (method === 'swish') {
  url = buildSwishPaymentUrl({ phoneNumber: child.phoneNumber, amount });
  label = 'Swish';
} else if (method === 'venmo') {
  url = buildVenmoPaymentUrl({ username: child.phoneNumber, amount });
  label = 'Venmo';
} else if (method === 'cashapp') {
  url = buildCashAppPaymentUrl({ cashtag: child.phoneNumber, amount });
  label = 'Cash App';
} else if (method === 'paypal') { // CHANGED
  const currency = (child.currency || 'SEK').toString(); // CHANGED
  url = buildPaypalPaymentUrl({ // CHANGED
    handle: child.phoneNumber, // still using the existing identifier field
    amount,
    currency,                  // pass child's currency (SEK, USD, etc.)
  });
  label = 'PayPal'; // CHANGED
}

    setPaymentModal({
      childId: child.id,
      childName: child.name,
      amount,
      url,
      methodLabel: label,
    });
    setPaymentStep('confirm');
  };

  const handleVerifyPayment = () => {
    setPaymentStep('verify');
  };

  const handleConfirmPaid = async () => { // CHANGED
    if (!paymentModal) return; // CHANGED
    try { // CHANGED
      const child = users.find((u) => u.id === paymentModal.childId); // CHANGED
      if (!child) { // CHANGED
        setPaymentModal(null); // CHANGED
        return; // CHANGED
      } // CHANGED

      // Persist balance reset to backend // CHANGED
      const updatedUser = await updateUserApi(child.id, { balance: 0 }); // CHANGED

      // Update local users list to reflect backend // CHANGED
      const updatedUsers = users.map((u) =>
        u.id === updatedUser.id ? updatedUser : u,
      ); // CHANGED

      onUpdateUsers(updatedUsers); // CHANGED
      setPaymentModal(null); // CHANGED
    } catch (err) { // CHANGED
      console.error('Failed to reset balance after payment', err); // CHANGED
      alert('Failed to reset balance in Veckopeng. Please try again.'); // CHANGED
    } // CHANGED
  };

  const handleSync = async () => {
    try {
      setSyncState('syncing');
      await reload();
      setSyncState('success');
      setTimeout(() => setSyncState('idle'), 1500);
    } catch (err) {
      console.error('Failed to sync state', err);
      setSyncState('idle');
      alert('Failed to sync state. Please try again.');
    }
  };

  if (!isParent) {
    // Child view handled in TaskManager; we keep this early return to avoid breaking behavior
    return null;
  }

  // Parent overview
  const children = users.filter((u) => u.role === 'child');
  const totalPending = tasks.filter((t) => t.status === 'pending').length;
  const totalWaiting = tasks.filter((t) => t.status === 'waiting_for_approval').length;
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;

  const totalBalances = children.reduce((sum, c) => sum + (c.balance ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            See how your family is doing this week.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {syncState === 'syncing' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Sync
        </button>
      </div>

      {/* High-level stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {tasks.length}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Total tasks
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Across all children
          </p>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {totalPending}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Pending
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Not started yet
          </p>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {totalWaiting}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Waiting approval
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Needs your review
          </p>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {totalBalances} kr
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            To be paid
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current balances
          </p>
        </Card>
      </div>

      {/* Children list with pay buttons */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Children balances
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('family')}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
          >
            <Users className="h-3.5 w-3.5" />
            Manage family
          </button>
        </div>

        {children.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No children added yet. Go to the Family tab to add them.
          </p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-100 flex items-center justify-center text-lg">
                    {child.avatar || '👤'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {child.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Balance:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {child.balance ?? 0} kr
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => initiatePayment(child.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pay {paymentModal.childName}
              </h3>
              <button
                onClick={() => setPaymentModal(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {paymentStep === 'confirm' && (
              <div className="space-y-4 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  You&apos;re about to open{' '}
                  <span className="font-semibold">{paymentModal.methodLabel}</span> with
                  the amount pre-filled.
                </p>
                <div className="rounded-xl bg-gray-50 p-3 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  <p className="flex items-center justify-between text-sm">
                    <span>Child</span>
                    <span className="font-semibold">
                      {paymentModal.childName}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-sm">
                    <span>Amount</span>
                    <span className="font-semibold">
                      {paymentModal.amount} kr
                    </span>
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModal(null)}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <a
                    href={paymentModal.url}
                    onClick={handleVerifyPayment}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Open {paymentModal.methodLabel}
                  </a>
                </div>
              </div>
            )}

            {paymentStep === 'verify' && (
              <div className="space-y-4 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  Please confirm that you completed the payment in{' '}
                  {paymentModal.methodLabel}. Once confirmed, the child&apos;s balance
                  will be reset to 0 kr in Veckopeng.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModal(null)}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Yes, payment is done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Layout Views Root
// ============================================

interface ViewsProps {
  currentUser: User | null;
  state: AppState;
  onUpdateState: (partial: Partial<AppState>) => void;
  onLogout: () => void;
  activeTab: 'home' | 'tasks' | 'family';
  onTabChange: (tab: 'home' | 'tasks' | 'family') => void;
}

export const Views: React.FC<ViewsProps> = ({
  currentUser,
  state,
  onUpdateState,
  onLogout,
  activeTab,
  onTabChange,
}) => {
  const { users, tasks } = state;
  const { reload } = useAppState();
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success'>('idle');

  const hasParent = users.some((u) => u.role === 'parent');
  const setupComplete = hasParent;

  const handleSync = async () => {
    try {
      setSyncState('syncing');
      await reload();
      setSyncState('success');
      setTimeout(() => setSyncState('idle'), 1500);
    } catch (err) {
      console.error('Failed to sync state', err);
      setSyncState('idle');
      alert('Failed to sync state. Please try again.');
    }
  };

  const handleSetupComplete = async () => {
    try {
      await reload();
    } catch (err) {
      console.error('Failed to reload after setup (Views)', err);
    }
  };

  if (!setupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Setup onComplete={handleSetupComplete} isFirstRun={!hasParent} />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const handleUpdateUsers = (updatedUsers: User[]) => {
    onUpdateState({ users: updatedUsers });
  };

  const handleUpdateTasks = (updatedTasks: Task[]) => {
    onUpdateState({ tasks: updatedTasks });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-24 sm:px-6 lg:px-8">
        {activeTab === 'home' && (
          <HomeDashboard
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            onUpdateUsers={handleUpdateUsers}
            onNavigate={(tab) => onTabChange(tab as 'tasks' | 'family')}
          />
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Tasks
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create, assign, and track family tasks.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSync}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                {syncState === 'syncing' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync
              </button>
            </div>
            <TaskManager
              currentUser={currentUser}
              users={users}
              tasks={tasks}
              onStateChange={onUpdateState}
            />
          </div>
        )}

        {activeTab === 'family' && currentUser.role === 'parent' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Family
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage parents, children, and payment details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('home')}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to overview
              </button>
            </div>
            <FamilyManager users={users} onUpdateUsers={handleUpdateUsers} />
          </div>
        )}
      </div>
    </div>
  );
};
