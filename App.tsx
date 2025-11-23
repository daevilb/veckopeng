import React, { useEffect, useState } from 'react';
import { AppState, User } from './types';
import { fetchState, saveState } from './services/api';
import { Setup, Login } from './components/Auth';
import { Layout } from './components/Layout';
import { HomeDashboard, TaskManager, FamilyManager } from './components/Views';
import { ThemeProvider } from './components/ThemeContext';

function AppContent() {
  const [state, setState] = useState<AppState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'family'>('home');
  const [loading, setLoading] = useState(true);

  // Load state from backend on first render
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchState();
        setState(data);
      } catch (error) {
        console.error('Failed to load state:', error);
        // Fallback to empty default state
        const emptyState: AppState = {
          users: [],
          tasks: [],
          theme: 'light',
        };
        setState(emptyState);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleUpdateState = async (partial: Partial<AppState>) => {
    if (!state) return;

    const newState: AppState = {
      ...state,
      ...partial,
    };

    setState(newState);

    try {
      await saveState(newState);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  const handleInitialUserComplete = async (user: User) => {
    const baseState: AppState =
      state ?? {
        users: [],
        tasks: [],
        theme: 'light',
      };

    const newState: AppState = {
      ...baseState,
      users: [...baseState.users, user],
    };

    setState(newState);
    setCurrentUser(user);

    try {
      await saveState(newState);
    } catch (error) {
      console.error('Failed to save initial user:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('home');
  };

  // -------------------
  // LOADING SCREEN
  // -------------------
  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center space-y-3">
          <div className="text-4xl">💫</div>
          <div className="text-sm text-slate-400">Loading your family dashboard...</div>
        </div>
      </div>
    );
  }

  // -------------------
  // FIRST RUN → SETUP PARENT
  // -------------------
  if (state.users.length === 0) {
    return <Setup isFirstRun={true} onComplete={handleInitialUserComplete} />;
  }

  // -------------------
  // NO USER LOGGED IN → LOGIN VIEW
  // -------------------
  if (!currentUser) {
    return (
      <Login
        users={state.users}
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveTab('home');
        }}
      />
    );
  }

  // -------------------
  // MAIN APP LAYOUT
  // -------------------
  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'home' && (
        <HomeDashboard
          currentUser={currentUser}
          users={state.users}
          tasks={state.tasks}
          onUpdateUsers={(users) => handleUpdateState({ users })}
          onNavigate={(tab) => setActiveTab(tab as 'home' | 'tasks' | 'family')}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskManager
          currentUser={currentUser}
          users={state.users}
          tasks={state.tasks}
          onStateChange={handleUpdateState}
        />
      )}

      {activeTab === 'family' && currentUser.role === 'parent' && (
        <FamilyManager
          users={state.users}
          onUpdateUsers={(users) => handleUpdateState({ users })}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
