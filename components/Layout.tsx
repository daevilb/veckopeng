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

interface LayoutProps {
  currentUser: {
    id: string;
    name: string;
    role: 'parent' | 'child';
  } | null;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  children,
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
      show: isParent,
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
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Veckopeng
                </h1>
                {currentUser && (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/40 dark:text-emerald-100">
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isParent ? 'Parent' : 'Child'}
                  </span>
                )}
              </div>
              {currentUser && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Signed in as{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {currentUser.name}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Right: theme + support + logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Support developer - only for parents */}
            {isParent && (
              <a
                href="https://buymeacoffee.com/andersbergz" // CHANGED
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-100"
              >
                <Coffee className="h-3.5 w-3.5" />
                <span>Support the developer</span>
              </a>
            )}

            {/* Logout */}
            {currentUser && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </header>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Bottom nav */}
      {currentUser && (
        
      <nav className="sticky bottom-0 w-full border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center">
          <div className="flex items-center justify-around gap-1 w-full max-w-sm">
            {tabs
              .filter((tab) => tab.show)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={[
                      'flex flex-col items-center justify-center px-4 py-1.5 rounded-xl text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-100'
                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{renderTabLabel(tab)}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </nav>
      )}
    </div>
  );
};

export default Layout;
