import React, { useState } from 'react';
import { User, Role } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { UserPlus, Lock, Phone, ChevronLeft, Check } from 'lucide-react';

interface SetupProps {
  onComplete: (user: User) => void;
  isFirstRun: boolean;
}

export const Setup: React.FC<SetupProps> = ({ onComplete, isFirstRun }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<Role>(isFirstRun ? 'parent' : 'child');
  const [avatar, setAvatar] = useState('👤');
  const [phone, setPhone] = useState('');

  const avatars = ['👨‍👩‍👧', '🦸‍♂️', '🦸‍♀️', '🧚', '🧞', '🦊', '🦄', '🦖', '⚽️', '🎨', '🎮', '🎸', '🤖', '🦁', '🐵', '🐼'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return alert("PIN must be 4 digits");
    
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      role,
      pin,
      avatar,
      phoneNumber: phone,
      balance: 0,
      totalEarned: 0
    };
    onComplete(newUser);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl dark:shadow-black/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isFirstRun ? 'Welcome to Veckopeng' : 'Add Family Member'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isFirstRun ? 'Set up the first parent account to get started.' : 'Expand your family circle.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Dad, or Leo"
          />

          {!isFirstRun && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">Role</label>
              <div className="flex gap-4">
                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${role === 'parent' ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input type="radio" className="hidden" checked={role === 'parent'} onChange={() => setRole('parent')} />
                  <div className="text-center font-semibold text-gray-900 dark:text-white">Parent</div>
                </label>
                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${role === 'child' ? 'bg-secondary/10 dark:bg-secondary/20 border-secondary dark:border-secondary' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input type="radio" className="hidden" checked={role === 'child'} onChange={() => setRole('child')} />
                  <div className="text-center font-semibold text-gray-900 dark:text-white">Child</div>
                </label>
              </div>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">Choose Avatar</label>
            <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              {avatars.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-3xl h-12 w-full flex items-center justify-center rounded-xl transition-all hover:bg-white dark:hover:bg-gray-700 hover:shadow-md ${avatar === a ? 'bg-white dark:bg-gray-700 shadow-md ring-2 ring-primary-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="4-Digit PIN"
            required
            type="password"
            maxLength={4}
            pattern="\d{4}"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="tracking-[0.5em] text-center font-mono text-lg"
            placeholder="••••"
          />

          {role === 'child' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              <Input
                label="Phone Number (for Swish)"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070..."
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2 ml-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg inline-block w-full">
                Required for parents to send allowance.
              </p>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" className="mt-4">
            <UserPlus className="w-5 h-5" />
            {isFirstRun ? 'Start App' : 'Create Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    if (pin === selectedUser.pin) {
      onLogin(selectedUser);
    } else {
      setError('Incorrect PIN');
      setPin('');
      setTimeout(() => setError(''), 2000);
    }
  };

  if (selectedUser) {
    return (
      <div className="w-full max-w-sm mx-auto animate-in zoom-in-95 duration-300">
        <Card className="text-center pt-10 pb-10 relative overflow-hidden">
           {/* Back Button */}
          <button 
            onClick={() => { setSelectedUser(null); setPin(''); }} 
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-7xl mb-4 drop-shadow-xl animate-bounce-slow">{selectedUser.avatar}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Hello {selectedUser.name}!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Enter your PIN to continue</p>
          
          <form onSubmit={handlePinSubmit} className="px-4">
            <div className="mb-8 relative max-w-[200px] mx-auto">
              <input
                autoFocus
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-bold tracking-[0.5em] border-b-2 border-gray-200 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 outline-none bg-transparent text-gray-900 dark:text-white py-2 transition-all"
                placeholder="••••"
              />
              {error && <p className="absolute w-full text-red-500 text-xs font-bold mt-3 animate-pulse">{error}</p>}
            </div>
            <Button type="submit" fullWidth size="lg" className="rounded-full">
              <Lock className="w-4 h-4" /> Unlock
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Who is using Veckopeng?</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Select your profile to log in</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map(user => (
          <Card
            key={user.id}
            variant="interactive"
            onClick={() => setSelectedUser(user)}
            className="flex flex-col items-center justify-center py-8 group"
          >
            <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110 duration-300">{user.avatar}</div>
            <div className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{user.name}</div>
            <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              user.role === 'parent' 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
            }`}>
              {user.role}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};