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
    // Start sequence after 30 seconds
    const startTimer = setTimeout(() => {
      setStage('walking-in');
    }, 30000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (stage === 'walking-in') {
      // Walk in takes about 4s
      timer = setTimeout(() => setStage('dropping'), 4000);
    } else if (stage === 'dropping') {
      // Drop takes 1s
      timer = setTimeout(() => setStage('walking-out'), 1000);
    } else if (stage === 'walking-out') {
      // Walk out takes 4s
      timer = setTimeout(() => setStage('bag-only'), 4000);
    } else if (stage === 'bag-only') {
      // Bag stays for 2 minutes (120 seconds)
      timer = setTimeout(() => setStage('idle'), 120000);
    }

    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === 'idle') return null;

  return (
    <div className="pointer-events-none fixed bottom-14 left-1/2 transform -translate-x-1/2 z-50 w-[200px] h-[60px] overflow-visible">
      {/* Alien */}
      <div 
        className={`absolute text-3xl transition-all duration-[4000ms] ease-linear ${
          stage === 'walking-in' ? 'left-1/2 translate-x-[-30px] opacity-100' : 
          stage === 'dropping' ? 'left-1/2 translate-x-[-30px] opacity-100' :
          stage === 'walking-out' ? 'left-[-50px] opacity-0' :
          stage === 'bag-only' ? 'left-[-50px] opacity-0' :
          'left-[250px] opacity-0' // Initial state (off screen right)
        }`}
      >
        👽
      </div>

      {/* Money Bag */}
      <div 
        className={`absolute text-2xl transition-all duration-[4000ms] ease-linear ${
          stage === 'walking-in' ? 'left-1/2 translate-x-[-10px] opacity-100' : // Moving with alien
          stage === 'dropping' ? 'left-1/2 translate-x-[-10px] opacity-100' : // Stopped
          stage === 'walking-out' ? 'left-1/2 translate-x-[-10px] opacity-100' : // Stays there
          stage === 'bag-only' ? 'left-1/2 translate-x-[-10px] opacity-100 transition-opacity duration-[2000ms]' : // Stays
          'left-[270px] opacity-0' // Initial state with alien
        }`}
        style={stage === 'bag-only' ? { transition: 'opacity 2s ease-in-out' } : undefined}
      >
        💰
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, activeTab, onTabChange, onLogout }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const tabs = [
    { id: 'home', label: 'Dashboard', icon: Home, show: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, show: true },
    { id: 'family', label: 'Family', icon: Users, show: currentUser.role === 'parent' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg transition-colors duration-300 relative">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border sticky top-0 z-30 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Side: Logo */}
          <div className="flex items-center gap-2">
             <div className="bg-primary-600 text-white p-1.5 rounded-lg">
               <CheckSquare size={20} strokeWidth={3} />
             </div>
             <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white hidden sm:block">Veckopeng</span>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {tabs.filter(t => t.show).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Side: Theme & User */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

            <div className="flex items-center gap-3 pl-2">
               <div className="text-right hidden md:block">
                 <div className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{currentUser.name}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</div>
               </div>
               <div className="text-3xl bg-gray-100 dark:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                 {currentUser.avatar}
               </div>
               <button 
                 onClick={onLogout} 
                 className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ml-1"
                 title="Log out"
               >
                 <LogOut size={20} />
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
          {children}
        </div>
      </main>

      {/* Footer with "Buy Me a Coffee" for Parents */}
      <footer className="hidden md:block pb-8 pt-4 text-center relative">
        {currentUser.role === 'parent' && (
          <>
            <a 
              href="#" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:scale-105 text-xs font-medium text-gray-600 dark:text-gray-300 transition-all relative z-20"
            >
              <Coffee size={14} className="text-amber-600 dark:text-amber-500" />
              <span>Support the developer</span>
            </a>
            <AlienEasterEgg />
          </>
        )}
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-dark-card/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-around z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none">
        {tabs.filter(t => t.show).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center p-2 w-full transition-all duration-300 ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon 
                className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2} 
                fill={isActive ? "currentColor" : "none"}
                fillOpacity={isActive ? 0.2 : 0}
              />
              <span className={`text-[10px] font-bold tracking-wide transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      {/* Mobile Footer Spacer */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};