import React, { useState } from 'react';
import { AppState, User, Task } from '../types';
import { Button } from './Button';
import { Setup } from './Auth';
import { Input } from './Input';
import { Card } from './Card';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Trash2,
  Plus,
  X,
  AlertCircle,
  Wallet,
  CheckSquare,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { generateId } from '../utils/id';

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

  const visibleTasks = isParent
    ? tasks
    : tasks.filter((t) => t.assignedToId === currentUser.id);

  const handleCreate = (e: React.FormEvent) => {
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

    onStateChange({ tasks: [...tasks, task] });

    setIsCreating(false);
    setNewTask({
      title: '',
      description: '',
      reward: 20,
      assignedToId: '',
    });
  };

  const handleDelete = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    onStateChange({ tasks: updatedTasks });
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    let updatedUsers = [...users];

    const updatedTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;

      // When parent approves a task (waiting_for_approval -> completed),
      // add the reward to the child's balance.
      if (status === 'completed' && t.status === 'waiting_for_approval') {
        const idx = updatedUsers.findIndex((u) => u.id === t.assignedToId);
        if (idx !== -1) {
          const child = updatedUsers[idx];
          updatedUsers[idx] = {
            ...child,
            balance: (child.balance ?? 0) + (t.reward ?? 0),
          };
        }
      }

      return {
        ...t,
        status,
        completedAt: status === 'completed' ? Date.now() : t.completedAt,
      };
    });

    onStateChange({ tasks: updatedTasks, users: updatedUsers });
  };

  const getStatusLabel = (status: TaskStatus) => {
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

  const getStatusBadgeClasses = (status: TaskStatus) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Tasks
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isParent
              ? 'Create, assign and approve tasks for your family.'
              : 'See your tasks and send them for approval.'}
          </p>
        </div>
        {isParent && !isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus size={18} />
            New Task
          </Button>
        )}
      </div>

      {/* Create Task */}
      {isParent && isCreating && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <Card className="border-primary-200 dark:border-primary-900/50 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 md:grid-cols-12 gap-4"
            >
              <div className="md:col-span-6">
                <Input
                  required
                  label="Title"
                  placeholder="e.g. Clean your room"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, title: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Description (optional)"
                  placeholder="Add more details"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, description: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  type="number"
                  min={0}
                  label="Reward (kr)"
                  value={newTask.reward}
                  onChange={(e) =>
                    setNewTask((t) => ({
                      ...t,
                      reward: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Assign to
                </label>
                <select
                  required
                  value={newTask.assignedToId}
                  onChange={(e) =>
                    setNewTask((t) => ({ ...t, assignedToId: e.target.value }))
                  }
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 outline-none"
                >
                  <option value="">Choose a family member</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 flex items-end justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newTask.title || !newTask.assignedToId}
                >
                  <CheckCircle size={18} />
                  Save Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Task list */}
      {visibleTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            No tasks yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isParent
              ? 'Create a task and assign it to one of your children to get started.'
              : 'Your parent has not assigned any tasks to you yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleTasks.map((task) => {
            const assignedChild = users.find((u) => u.id === task.assignedToId);
            const canSendForApproval =
              !isParent &&
              task.assignedToId === currentUser.id &&
              task.status === 'pending';
            const canApprove =
              isParent && task.status === 'waiting_for_approval';
            const canReject =
              isParent && task.status === 'waiting_for_approval';

            return (
              <Card
                key={task.id}
                className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  task.status === 'completed'
                    ? 'opacity-80 hover:opacity-100'
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
                  {canSendForApproval && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        handleStatusChange(task.id, 'waiting_for_approval')
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as done
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        handleStatusChange(task.id, 'completed')
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & add to balance
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleStatusChange(task.id, 'pending')
                      }
                    >
                      <X className="w-4 h-4" />
                      Send back
                    </Button>
                  )}
                  {isParent && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
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

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  users,
  tasks,
  onUpdateUsers,
  onNavigate,
}) => {
  const isParent = currentUser.role === 'parent';

  if (!isParent) {
    const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
    const pending = myTasks.filter((t) => t.status === 'pending').length;
    const waiting = myTasks.filter(
      (t) => t.status === 'waiting_for_approval',
    ).length;
    const done = myTasks.filter((t) => t.status === 'completed').length;

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {pending}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Tasks to do
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for you to complete.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
                Your parent will review these.
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

        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              Go to your tasks
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              See details and mark tasks as done when you complete them.
            </p>
          </div>
          <Button onClick={() => onNavigate('tasks')}>
            <CheckSquare className="w-4 h-4" />
            Open tasks
          </Button>
        </Card>
      </div>
    );
  }

  // Parent view
  const children = users.filter((u) => u.role === 'child');
  const totalBalance = children.reduce(
    (sum, c) => sum + (c.balance ?? 0),
    0,
  );
  const waitingTasks = tasks.filter(
    (t) => t.status === 'waiting_for_approval',
  );

  const handlePayment = (childId: string) => {
    const child = users.find((u) => u.id === childId);
    if (!child || (child.balance ?? 0) <= 0) return;

    if (!child.phoneNumber) {
      alert(
        `Please add a phone number for ${child.name} in the Family tab to use Swish.`,
      );
      return;
    }

    const paymentData = {
      version: 1,
      payee: { value: child.phoneNumber },
      amount: { value: child.balance },
      message: { value: 'Veckopeng' },
    };

    const url = `swish://payment?data=${encodeURIComponent(
      JSON.stringify(paymentData),
    )}`;

    const confirmed = window.confirm(
      `Open Swish to pay ${child.balance} kr to ${child.name} (${child.phoneNumber})?`,
    );

    if (confirmed) {
      window.location.href = url;
      setTimeout(() => {
        if (
          window.confirm(
            'Did the payment go through successfully? Press OK to reset balance to 0.',
          )
        ) {
          const updated = users.map((u) =>
            u.id === childId ? { ...u, balance: 0 } : u,
          );
          onUpdateUsers(updated);
        }
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {currentUser.name} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Overview of your family’s chores, allowance and approvals.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalBalance} kr
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Total pending payouts
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sum of all childrens’ current balances.
            </p>
          </div>
        </Card>

        <Card
          className="flex flex-col gap-3 cursor-pointer"
          onClick={() => onNavigate('tasks')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {waitingTasks.length}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Waiting approvals
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tasks that children have sent for approval.
            </p>
          </div>
        </Card>

        <Card
          className="flex flex-col gap-3 cursor-pointer"
          onClick={() => onNavigate('family')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {children.length}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Children
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage family members and phone numbers.
            </p>
          </div>
        </Card>
      </div>

      {/* Children list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Children overview
        </h3>
        {children.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No children added yet. Go to the Family tab to add your first
              child.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => {
              const childTasks = tasks.filter(
                (t) => t.assignedToId === child.id,
              );
              const pending = childTasks.filter(
                (t) => t.status === 'pending',
              ).length;
              const waiting = childTasks.filter(
                (t) => t.status === 'waiting_for_approval',
              ).length;
              const completed = childTasks.filter(
                (t) => t.status === 'completed',
              ).length;

              return (
                <Card key={child.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {child.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Child
                      </p>
                      {child.phoneNumber && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                          {child.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
                        <DollarSign className="w-4 h-4" />
                        {child.balance ?? 0} kr
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current balance
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {pending} to do
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {waiting} waiting
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {completed} done
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <Button
                      variant="secondary"
                      onClick={() => onNavigate('tasks')}
                    >
                      <CheckSquare className="w-4 h-4" />
                      View tasks
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!child.balance}
                      onClick={() => handlePayment(child.id)}
                    >
                      <Smartphone className="w-4 h-4" />
                      Pay with Swish
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
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

  const handleAddUser = (newUser: User) => {
    onUpdateUsers([...users, newUser]);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Family members
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage parents, children and phone numbers.
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <UserIcon size={18} />
            Add member
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 max-w-md mx-auto">
          <Setup isFirstRun={false} onComplete={handleAddUser} />
          <div className="text-center mt-4">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* list */}
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((u) => (
          <Card key={u.id} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-semibold">
                  {u.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {u.role === 'parent' ? 'Parent' : 'Child'}
                  </p>
                </div>
              </div>
              {u.phoneNumber && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">
                  {u.phoneNumber}
                </p>
              )}
              {typeof u.balance === 'number' && u.role === 'child' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 inline-flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Current balance:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {u.balance} kr
                  </span>
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                u.role === 'parent'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
              }`}
            >
              {u.role}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
