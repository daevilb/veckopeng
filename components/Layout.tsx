import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Home, CheckSquare, Users, LogOut, Moon, Sun, Coffee } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

// Alien Easter Egg Component
const AlienEasterEgg = () => {
  const [stage, setStage] = useState<'idle' | 'walking-in' | 'dropping' | 'walking-out' | 'bag-only'>('idle');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStage('walking-in');

      setTimeout(() => setStage('dropping'), 2000);
      setTimeout(() => setStage('walking-out'), 3500);
      setTimeout(() => setStage('bag-only'), 5000);
      setTimeout(() => setStage('idle'), 11000);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (stage === 'idle') return null;

  return (
    <div className="hidden md:block fixed bottom-16 right-16 pointer-events-none z-40">
      <div className="relative h-24 w-40">
        {/* Ground shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 blur-lg" />

        {/* Alien */}
        <div
          className={`absolute text-3xl transition-all duration-[4000ms] ease-linear ${
            stage === 'walking-in'
              ? 'left-[250px] opacity-100'
              : stage === 'dropping'
              ? 'left-1/2 translate-x-[-30px] opacity-100'
              : stage === 'walking-out'
              ? 'left-[-50px] opacity-0'
              : stage === 'bag-only'
              ? 'left-[-50px] opacity-0'
              : 'left-[250px] opacity-0'
          }`}
        >
          👽
        </div>

        {/* Coffee cup dropping */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 transition-all duration-700 ${
            stage === 'dropping' ? 'top-6 opacity-100' : 'top-[-10px] opacity-0'
          }`}
        >
          ☕
        </div>

        {/* Static coffee cup on the ground */}
        {stage === 'bag-only' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-6">
            ☕
          </div>
        )}
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, currentUser, activeTab, onTabChange, onLogout }) => {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  const tabs = [
    { id: 'home', label: currentUser.role === 'parent' ? 'Overview' : 'My Week', icon: Home, show: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, show: true },
    { id: 'family', label: 'Family', icon: Users, show: currentUser.role === 'parent' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled ? 'backdrop-blur-xl bg-slate-900/80' : 'bg-gradient-to-b from-slate-950/80 to-slate-900/40'
        } border-b border-slate-800/60`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & App Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <span className="text-xl font-black text-slate-950 drop-shadow-sm">V</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-50">Veckopeng</h1>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    BETA
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Chores, allowance, and quick mobile payments for your family.
                </p>
              </div>
            </div>

            {/* Right: Theme toggle & user */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-200 shadow-sm hover:border-emerald-400/60 hover:text-emerald-300 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-700/70">
                <span className="text-lg">{currentUser.avatar}</span>
                <div className="leading-tight">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Logged in as</div>
                  <div className="text-sm font-semibold text-slate-50">{currentUser.name}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/40 transition-all"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-[11px]">✓</span>
              </span>
              <span>
                Signed in as <span className="font-semibold">{currentUser.name}</span> ({currentUser.role})
              </span>
            </div>
          </div>

          <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">{children}</div>
        </div>
      </main>

      {/* Footer with BuyMeACoffee link – now visible även på mobil */}
      <footer className="block pb-24 md:pb-8 pt-4 text-center relative">
        {currentUser.role === 'parent' && (
          <>
            <a
              href="https://buymeacoffee.com/andersbergz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-100 text-xs sm:text-sm font-medium hover:bg-slate-800/90 hover:border-amber-400 transition-all relative z-20 hover:opacity-80"
            >
              <Coffee size={14} className="text-amber-600 dark:text-amber-500" />
              <span>Support the developer</span>
            </a>
            <AlienEasterEgg />
          </>
        )}
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-slate-950/95 border-t border-slate-200/60 dark:border-slate-800/80 backdrop-blur-xl px-4 py-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {tabs.filter((t) => t.show).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1 flex-1"
              >
                <div
                  className={`absolute inset-0 transition-all duration-300 ${
                    isActive ? 'scale-105 bg-emerald-500/15' : 'opacity-0'
                  }`}
                />

                <div
                  className={`relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-500/90 text-slate-950 shadow-lg shadow-emerald-500/40 translate-y-[-3px]'
                      : 'bg-slate-900/80 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <span
                  className={`relative z-10 text-[11px] font-medium ${
                    isActive ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export { Layout };
