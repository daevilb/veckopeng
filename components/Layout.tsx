import React, { useEffect, useState } from 'react';
import { Member } from '../types';
import { Logout, Home, ListTodo, Users, Smartphone, PiggyBank, Coffee } from 'lucide-react';

interface LayoutProps {
  currentUser: Member;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentUser, onLogout, onNavigate, children }) => {
  const [active, setActive] = useState<string>('dashboard');

  const handleNav = (view: string) => {
    setActive(view);
    onNavigate(view);
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900">

      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-4 shadow-md bg-white dark:bg-gray-800 sticky top-0 z-50">
        <h1 className="text-xl font-bold">Veckopeng</h1>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
        >
          <Logout size={16} />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 md:px-8">
        {children}
      </main>

      {/* Footer: Support link for PARENTS only */}
      <footer className="hidden md:block pb-8 pt-4 text-center relative">
        {currentUser.role === 'parent' && (
          <>
            <a
              href="https://buymeacoffee.com/andersbergz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 transition-all relative z-20 hover:opacity-80"
            >
              <Coffee size={14} className="text-amber-600 dark:text-amber-500" />
              <span>Support the developer</span>
            </a>
          </>
        )}
      </footer>

      {/* Bottom Navbar (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg py-2 flex justify-around">
        <button onClick={() => handleNav('dashboard')} className={`p-2 ${active === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          <Home size={20} />
        </button>
        <button onClick={() => handleNav('tasks')} className={`p-2 ${active === 'tasks' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          <ListTodo size={20} />
        </button>
        {currentUser.role === 'parent' && (
          <button onClick={() => handleNav('family')} className={`p-2 ${active === 'family' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            <Users size={20} />
          </button>
        )}
        <button onClick={() => handleNav('mobile')} className={`p-2 ${active === 'mobile' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          <Smartphone size={20} />
        </button>
        <button onClick={() => handleNav('balance')} className={`p-2 ${active === 'balance' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          <PiggyBank size={20} />
        </button>
      </nav>

      {/* Spacing for mobile nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};
