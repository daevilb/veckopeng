import React from 'react';
import {
  Home,
  CheckSquare,
  Users,
  LogOut,
  Smartphone,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppState } from './StateProvider';
import { useTheme } from './ThemeContext';

type TabId = 'home' | 'tasks' | 'family';

type TabConfig = {
  id: TabId;
  label: string;
  show: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

interface LayoutProps {
  children: React.ReactNode;
  currentUser: any; // generic to avoid mismatch with types.ts
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const { state } = useAppState();
  const { theme, setTheme } = useTheme();

  const isParent = currentUser?.role === 'parent';

  const tabs: TabConfig[] = [
    {
      id: 'home',
      label: isParent ? 'Overview' : 'My week',
      icon: Home,
      show: true,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      show: true,
    },
    {
      id: 'family',
      label: 'Family',
      icon: Users,
      show: isParent,
    },
  ];

  const pendingApprovals = state.tasks.filter(
    (t) => t.status === 'waiting_for_approval',
  ).length;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const renderTabLabel = (tab: TabConfig) => {
    if (tab.id === 'tasks' && isParent && pendingApprovals > 0) {
      return (
        <span className="inline-flex items-center gap-1">
          <span>{tab.label}</span>
          <span className="rounded-full bg-red-500/10 text-[10px] px-1.5 py-0.5 text-red-500 font-medium">
            {pendingApprovals}
          </span>
        </span>
      );
    }

    return tab.label;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <header className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: app title + user */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm sm:text-base truncate">
                  Veckopeng
                </h1>
                {isParent && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20">
                    <Smartphone className="h-3 w-3" />
                    Parent mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Signed in as{' '}
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {currentUser?.name ?? 'Unknown'}
                </span>
              </p>
            </div>
          </div>

          {/* Right: theme toggle + support + logout */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Support link */}
            <a
              href="https://www.buymeacoffee.com/daevilb"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <Coffee className="h-3.5 w-3.5" />
              Support
            </a>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Desktop nav */}
        <nav className="hidden md:block border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 flex gap-1 py-1.5">
            {tabs
              .filter((t) => t.show)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    {renderTabLabel(tab)}
                  </button>
                );
              })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
        <div className="flex justify-around">
          {tabs
            .filter((t) => t.show)
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={[
                    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
