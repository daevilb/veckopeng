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
  onStateChange: (changes: Partial<AppState>) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ currentUser, users, tasks, onStateChange }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ reward: 20, title: '' });

  const userTasks = currentUser.role === 'child' 
    ? tasks.filter(t => t.assignedToId === currentUser.id)
    : tasks;

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

    onStateChange({ tasks: [...tasks, task] });
    setIsCreating(false);
    setNewTask({ reward: 20, title: '' });
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    let updatedUsers = [...users];
    
    const updatedTasks = tasks.map(t => {
      if (t.id !== taskId) return t;
      
      // Logic: If a task moves to 'completed' (Approved by parent), we update the balance.
      if (status === 'completed' && t.status === 'waiting_for_approval') {
        const childIndex = updatedUsers.findIndex(u => u.id === t.assignedToId);
        if (childIndex !== -1) {
          const child = updatedUsers[childIndex];
          updatedUsers[childIndex] = {
            ...child,
            balance: child.balance + t.reward,
            totalEarned: child.totalEarned + t.reward
          };
        }
      }
      return { ...t, status };
    });

    onStateChange({ tasks: updatedTasks, users: updatedUsers });
  };

  const handleDelete = (id: string) => {
    onStateChange({ tasks: tasks.filter(t => t.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tasks</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage household chores and rewards</p>
        </div>
        {currentUser.role === 'parent' && (
          <Button onClick={() => setIsCreating(true)} className="shadow-primary-500/30">
            <Plus size={18} /> New Task
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <Card className="border-primary-200 dark:border-primary-900/50 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Task</h3>
               <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
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
              <div className="md:col-span-3">
                <Input
                  type="number"
                  required
                  label="Reward (SEK)"
                  placeholder="20"
                  value={newTask.reward}
                  onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  as="select"
                  required
                  label="Assign To"
                  value={newTask.assignedToId || ''}
                  onChange={e => setNewTask({...newTask, assignedToId: e.target.value})}
                >
                  <option value="">Select child...</option>
                  {users.filter(u => u.role === 'child').map(u => (
                    <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>
                  ))}
                </Input>
              </div>
              <div className="md:col-span-12 flex justify-end gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {userTasks.length === 0 && (
          <div className="text-center py-16 bg-gray-50 dark:bg-dark-card/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400">All caught up! Relax or ask for more chores.</p>
          </div>
        )}
        
        {userTasks.map(task => {
          const assignee = users.find(u => u.id === task.assignedToId);
          
          let statusColor = '';
          let statusText = '';
          
          switch(task.status) {
            case 'pending': 
              statusColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'; 
              statusText = 'To Do';
              break;
            case 'waiting_for_approval': 
              statusColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'; 
              statusText = 'Review';
              break;
            case 'completed': 
              statusColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'; 
              statusText = 'Done';
              break;
          }

          return (
            <Card key={task.id} className={`transition-all hover:shadow-md group ${task.status === 'completed' ? 'opacity-60 hover:opacity-100' : ''}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 ${task.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'}`}>
                     {task.status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg text-gray-900 dark:text-white ${task.status === 'completed' ? 'line-through decoration-2 decoration-gray-300 dark:decoration-gray-600' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                       <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                         <span>{assignee?.avatar}</span>
                         <span className="font-medium">{assignee?.name}</span>
                       </div>
                       <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                         <DollarSign size={12}/> {task.reward} kr
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-800">
                  <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg tracking-wider ${statusColor}`}>
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
                             <Button onClick={() => handleStatusChange(task.id, 'pending')} variant="secondary" size="sm">Reject</Button>
                             <Button onClick={() => handleStatusChange(task.id, 'completed')} size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500">Approve</Button>
                          </div>
                        )}
                        <Button onClick={() => handleDelete(task.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:bg-red-900/20">
                          <Trash2 size={18} />
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
  
  const handlePayment = (childId: string) => {
    const child = users.find(u => u.id === childId);
    if (!child || child.balance <= 0) return;

    if (!child.phoneNumber) {
      alert(`Please add a phone number for ${child.name} in the Family tab to use Swish.`);
      return;
    }

    const paymentData = {
      version: 1,
      payee: { value: child.phoneNumber }, 
      amount: { value: child.balance },
      message: { value: "Veckopeng" }
    };

    const url = `swish://payment?data=${encodeURIComponent(JSON.stringify(paymentData))}`;
    
    const confirmed = confirm(`Open Swish to pay ${child.balance} kr to ${child.name} (${child.phoneNumber})?`);
    
    if (confirmed) {
       window.location.href = url;
       setTimeout(() => {
         if (confirm("Did the payment go through successfully? Press OK to reset balance to 0.")) {
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
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-purple-700 dark:from-primary-800 dark:to-indigo-900 rounded-3xl p-8 text-white shadow-2xl shadow-primary-500/30">
          <div className="relative z-10">
            <p className="opacity-80 font-medium mb-1 text-primary-100 uppercase tracking-wider text-sm">Current Balance</p>
            <div className="flex items-baseline gap-2">
               <h1 className="text-7xl font-extrabold tracking-tight">{currentUser.balance}</h1>
               <span className="text-3xl font-medium opacity-80">kr</span>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm bg-white/10 backdrop-blur-sm p-3 rounded-xl inline-flex">
              <Wallet className="text-primary-200" size={18} />
              <span className="opacity-90">Lifetime Earnings: <span className="font-bold">{currentUser.totalEarned} kr</span></span>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Family Overview</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track balances and pay allowances</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map(child => (
          <Card key={child.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-5 mb-6">
              <div className="text-5xl bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center shadow-inner">
                {child.avatar}
              </div>
              <div>
                <h3 className="font-bold text-2xl text-gray-900 dark:text-white">{child.name}</h3>
                {!child.phoneNumber ? (
                   <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md flex items-center gap-1 mt-1">
                     <AlertCircle size={10}/> No Phone #
                   </span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block font-mono tracking-wider">{child.phoneNumber}</span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
              <div className="flex items-baseline gap-1 text-gray-900 dark:text-white">
                 <span className="text-4xl font-bold">{child.balance}</span>
                 <span className="text-lg text-gray-500">kr</span>
              </div>
            </div>

            <Button 
              fullWidth
              disabled={child.balance === 0}
              onClick={() => handlePayment(child.id)}
              className="bg-gradient-to-r from-[#E53636] to-[#FF6B6B] hover:from-[#d92e2e] hover:to-[#ff5252] text-white border-none shadow-red-500/20"
            >
              Swish Payment
            </Button>
          </Card>
        ))}
        
        {/* Add Child Card Placeholder if needed or just empty state */}
        {children.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-dark-card rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-50">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No children yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add family members to start managing allowances.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- FAMILY MANAGER ---

export const FamilyManager: React.FC<{ users: User[], onUpdateUsers: (u: User[]) => void }> = ({ users, onUpdateUsers }) => {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Family Members</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage accounts and PINs</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}><UserIcon size={18} /> Add Member</Button>
        )}
      </div>

      {isAdding ? (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
           <div className="max-w-md mx-auto">
             <Setup isFirstRun={false} onComplete={(newUser) => {
               onUpdateUsers([...users, newUser]);
               setIsAdding(false);
             }} />
             <div className="text-center mt-6">
               <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-gray-500">Cancel</Button>
             </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <Card key={u.id} className="flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
              <div className="text-4xl bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center">
                {u.avatar}
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">{u.name}</div>
                <div className="flex items-center gap-2">
                   <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                     u.role === 'parent' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                   }`}>
                     {u.role}
                   </span>
                </div>
                {u.phoneNumber && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{u.phoneNumber}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
