import React, { useState } from 'react';
import { AppState, User, Task } from '../types';
import { Button } from './Button';
import { Setup } from './Auth';
import { Input } from './Input';
import { Card } from './Card';
import { CheckCircle, Clock, DollarSign, Trash2, Plus, X, ArrowRight, User as UserIcon, ExternalLink, AlertCircle, Wallet, CheckSquare } from 'lucide-react';
import { generateId } from '../utils/id';


// --- TASK MANAGER COMPONENT ---

interface TaskManagerProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onUpdateState: (state: Partial<AppState>) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ currentUser, users, tasks, onUpdateState }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'waiting_for_approval' | 'completed'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: 10,
    assignedToId: '',
  });

  const visibleTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const filteredTasks = assigneeFilter === 'all'
    ? visibleTasks
    : visibleTasks.filter(t => t.assignedToId === assigneeFilter);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.reward || !newTask.assignedToId) return;

    const task: Task = {
      id: generateId(),
      title: newTask.title,
      description: newTask.description || '',
      reward: Number(newTask.reward),
      assignedToId: newTask.assignedToId,
      status: 'pending',
      createdAt: Date.now(),
    };

    onUpdateState({ tasks: [...tasks, task] });
    setNewTask({
      title: '',
      description: '',
      reward: 10,
      assignedToId: '',
    });
    setIsCreating(false);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        if (currentUser.role === 'parent') {
          // If parent changes status to completed, update child's balance
          if (newStatus === 'completed' && task.status !== 'completed') {
            const child = users.find(u => u.id === task.assignedToId);
            if (child) {
              const updatedUsers = users.map(u =>
                u.id === child.id
                  ? {
                      ...u,
                      balance: u.balance + task.reward,
                      totalEarned: u.totalEarned + task.reward,
                    }
                  : u
              );
              onUpdateState({ users: updatedUsers });
            }
          }
        }
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? Date.now() : undefined,
        };
      }
      return task;
    });

    onUpdateState({ tasks: updatedTasks });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Delete this task?')) {
      onUpdateState({ tasks: tasks.filter(t => t.id !== taskId) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tasks</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create, assign, and track chores for your family.
          </p>
        </div>
        {currentUser.role === 'parent' && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-900 p-1">
          {['all', 'pending', 'waiting_for_approval', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {f === 'all' && 'All'}
              {f === 'pending' && 'To Do'}
              {f === 'waiting_for_approval' && 'In Review'}
              {f === 'completed' && 'Completed'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Filter by kid:
          </span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-sm bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All kids</option>
            {users
              .filter((u) => u.role === 'child')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* New Task Form */}
      {currentUser.role === 'parent' && isCreating && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <Card className="border-primary-200 dark:border-primary-900/50 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Task</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <Input
                  required
                  label="Title"
                  placeholder="e.g. Clean your room"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Description"
                  placeholder="Optional details or instructions"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Reward"
                  type="number"
                  min={1}
                  value={newTask.reward}
                  onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})}
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 ml-1">
                  Assign to
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTask.assignedToId}
                  onChange={e => setNewTask({...newTask, assignedToId: e.target.value})}
                  required
                >
                  <option value="">Select child</option>
                  {users.filter(u => u.role === 'child').map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 flex items-end">
                <Button type="submit" fullWidth>
                  <CheckSquare className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Task List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-2">🧹</div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">No tasks yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a chore to get started.
            </p>
          </Card>
        )}

        {filteredTasks.map(task => {
          const assignee = users.find(u => u.id === task.assignedToId);
          const isChild = currentUser.role === 'child';
          let statusColor = '';
          let statusText = '';

          switch (task.status) {
            case 'pending':
              statusColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
              statusText = 'Pending';
              break;
            case 'waiting_for_approval':
              statusColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
              statusText = 'Review';
              break;
            case 'completed':
              statusColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
              statusText = 'Done';
              break;
          }

          return (
            <Card
              key={task.id}
              className={`transition-all duration-200 ${
                task.status === 'completed' ? 'opacity-60 hover:opacity-100' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300'
                        : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    }`}
                  >
                    {task.status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-lg text-gray-900 dark:text-white ${
                        task.status === 'completed' ? 'line-through decoration-2 decoration-gray-300 dark:decoration-gray-600' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        <span>{assignee?.avatar}</span>
                        <span className="font-medium">{assignee?.name}</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <DollarSign size={12} /> {task.reward} kr
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-center border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-800">
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg tracking-wider ${statusColor}`}
                  >
                    {statusText}
                  </span>

                  <div className="flex gap-2">
                    {/* Child Actions */}
                    {currentUser.role === 'child' && task.status === 'pending' && (
                      <Button onClick={() => handleStatusChange(task.id, 'waiting_for_approval')} size="sm">
                        Mark Done
                      </Button>
                    )}

                    {/* Parent Actions */}
                    {currentUser.role === 'parent' && (
                      <>
                        {task.status === 'waiting_for_approval' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(task.id, 'pending')}
                              variant="secondary"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete task"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- HOME DASHBOARD ---

export const HomeDashboard: React.FC<{
  currentUser: User;
  users: User[];
  tasks: Task[];
  onUpdateUsers: (u: User[]) => void;
  onNavigate: (tab: string) => void;
}> = ({ currentUser, users, tasks, onUpdateUsers, onNavigate }) => {

  const getCurrencySymbol = (user?: User) => user?.currency === 'USD' ? '$' : 'kr';

  const getPaymentMethodLabel = (method?: User['paymentMethod']) => {
    switch (method) {
      case 'venmo':
        return 'Venmo';
      case 'cashapp':
        return 'Cash App';
      default:
        return 'Swish';
    }
  };


  const handlePayment = (childId: string) => {
    const child = users.find(u => u.id === childId);
    if (!child || child.balance <= 0) return;

    const methodLabel = getPaymentMethodLabel(child.paymentMethod);
    const currencySymbol = getCurrencySymbol(child);

    if (!child.phoneNumber) {
      alert(`Please add a payment handle for ${child.name} in the Family tab to use ${methodLabel}.`);
      return;
    }

    let url = '';

    if (child.paymentMethod === 'venmo') {
      const raw = child.phoneNumber.trim();
      const venmoUser = raw.startsWith('@') ? raw.slice(1) : raw;
      url = `https://venmo.com/${encodeURIComponent(venmoUser)}?txn=pay&amount=${child.balance}&note=${encodeURIComponent('Veckopeng')}`;
    } else if (child.paymentMethod === 'cashapp') {
      const raw = child.phoneNumber.trim();
      const cashtag = raw.startsWith('$') ? raw.slice(1) : raw;
      url = `https://cash.app/$${encodeURIComponent(cashtag)}/${child.balance}`;
    } else {
      const paymentData = {
        version: 1,
        payee: { value: child.phoneNumber },
        amount: { value: child.balance },
        message: { value: 'Veckopeng' },
      };
      url = `swish://payment?data=${encodeURIComponent(JSON.stringify(paymentData))}`;
    }

    const confirmed = confirm(`Open ${methodLabel} to pay ${child.balance} ${currencySymbol} to ${child.name} (${child.phoneNumber})?`);

    if (confirmed) {
      window.location.href = url;
      setTimeout(() => {
        if (confirm('Did the payment go through successfully? Press OK to reset balance to 0.')) {
          const updated = users.map(u => u.id === childId ? { ...u, balance: 0 } : u);
          onUpdateUsers(updated);
        }
      }, 1000);
    }
  };

  // CHILD VIEW
  if (currentUser.role === 'child') {
    const myTasks = tasks.filter(t => t.assignedToId === currentUser.id && t.status === 'pending');
    const pendingReview = tasks.filter(t => t.assignedToId === currentUser.id && t.status === 'waiting_for_approval');
    
    return (
      <div className="space-y-8">
        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-emerald-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl shadow-primary-500/30">
          <div className="relative z-10">
            <p className="opacity-80 font-medium mb-1 text-primary-100 uppercase tracking-wider text-sm">Current Balance</p>
            <div className="flex items-baseline gap-2">
               <h1 className="text-7xl font-extrabold tracking-tight">{currentUser.balance}</h1>
               <span className="text-3xl font-medium opacity-80">{getCurrencySymbol(currentUser)}</span>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm bg-white/10 backdrop-blur-sm p-3 rounded-xl inline-flex">
              <Wallet className="text-primary-200" size={18} />
              <span className="opacity-90">Lifetime Earnings: <span className="font-bold">{currentUser.totalEarned} {getCurrencySymbol(currentUser)}</span></span>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 -mb-16 -ml-8 w-32 h-32 bg-emerald-400/40 rounded-full blur-3xl opacity-70"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            variant="interactive" 
            className="border-l-4 border-l-primary-500"
            onClick={() => onNavigate('tasks')}
          >
             <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl text-primary-600 dark:text-primary-400">
                  <Clock size={24} />
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{myTasks.length}</span>
             </div>
             <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tasks To Do</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm">Tasks waiting for you to complete.</p>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-amber-500">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400">
                  <CheckCircle size={24} />
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{pendingReview.length}</span>
             </div>
             <h3 className="font-bold text-lg text-gray-900 dark:text-white">In Review</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm">Waiting for parent approval.</p>
          </Card>
        </div>
      </div>
    );
  }

  // PARENT VIEW
  const children = users.filter(u => u.role === 'child');

  return (
    <div className="space-y-8">
      {/* Parent header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary-500/20 flex items-center justify-center text-2xl">
              {currentUser.avatar}
            </span>
            <span>{currentUser.name}&apos;s Overview</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Track balances and pay allowances
          </p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate('tasks')}>
          <CheckSquare size={18} />
          Manage Tasks
        </Button>
      </div>

      {/* Children cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children.map(child => (
          <Card key={child.id} variant="interactive" className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary-500/10 rounded-bl-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">
                  {child.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    {child.name}
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Child
                    </span>
                  </h3>
                  {child.phoneNumber ? (
                    <span className="text-xs text-gray-400 dark:text-gray-400 mt-1 block font-mono tracking-wider">
                      {child.phoneNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      Missing payment handle
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Current Balance
                </p>
                <div className="flex items-baseline gap-1 text-gray-900 dark:text-white">
                  <span className="text-4xl font-bold">{child.balance}</span>
                  <span className="text-lg text-gray-500">{getCurrencySymbol(child)}</span>
                </div>
              </div>

              <Button 
                fullWidth
                disabled={child.balance === 0}
                onClick={() => handlePayment(child.id)}
                className="bg-gradient-to-r from-[#E53636] to-[#FF3B2E] hover:from-[#ff3b2e] hover:to-[#ff5252] text-white border-none shadow-red-500/20"
              >
                {getPaymentMethodLabel(child.paymentMethod)} Payment
              </Button>
            </div>
          </Card>
        ))}
        
        {/* Empty state */}
        {children.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-50">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No children yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add family members to start managing allowances.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- FAMILY MANAGER ---

interface FamilyManagerProps {
  currentUser: User;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export const FamilyManager: React.FC<FamilyManagerProps> = ({ currentUser, users, onUpdateUsers }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleUserCreated = (user: User) => {
    onUpdateUsers([...users, user]);
    setIsAdding(false);
  };

  const handleRemoveUser = (userId: string) => {
    if (!confirm('Delete this user? All their data will be removed.')) return;
    onUpdateUsers(users.filter(u => u.id !== userId));
  };

  if (currentUser.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Parents only</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Only parents can manage family members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text:white tracking-tight">Family</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage accounts and PINs</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <UserIcon size={18} /> Add Member
          </Button>
        )}
      </div>

      {isAdding ? (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="max-w-md mx-auto">
            <Setup isFirstRun={false} onComplete={(newUser) => {
              onUpdateUsers([...users, newUser]);
              setIsAdding(false);
            }} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map(user => (
            <Card key={user.id} className="relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 bg-primary-500/5 rounded-bl-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">
                    {user.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      {user.name}
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        user.role === 'parent'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {user.role}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Balance: {user.balance}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 mt-4">
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                  {user.phoneNumber && (
                    <a
                      href={`tel:${user.phoneNumber}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                    >
                      <Phone size={12} />
                      Call
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
