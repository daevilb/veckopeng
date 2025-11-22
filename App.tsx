import React, { useEffect, useState } from 'react';
import { AppState, User, Task } from './types';
import { fetchState, saveState } from './services/api';
import { Setup, Login } from './components/Auth';
import { Layout } from './components/Layout';
import { HomeDashboard, TaskManager, FamilyManager } from './components/Views';
import { ThemeProvider } from './components/ThemeContext';

function AppContent() {
  const [state, setState] = useState<AppState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchState();
    setState(data);
    setLoading(false);
  };

  const handleUpdateState = async (newState: Partial<AppState>) => {
    if (!state) return;
    const updatedState = { ...state, ...newState };
    setState(updatedState);
    await saveState(updatedState);
  };

  const handleSetupComplete = (firstUser: User) => {
    handleUpdateState({ users: [firstUser] });
    setCurrentUser(firstUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <div className="text-primary-600 dark:text-primary-400 font-bold text-2xl mb-2">Veckopeng</div>
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!state) return <div>Error loading app state.</div>;

  // 1. First Time Setup
  if (state.users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6">
        <Setup isFirstRun={true} onComplete={handleSetupComplete} />
      </div>
    );
  }

  // 2. Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6 transition-colors duration-300">
        <Login users={state.users} onLogin={setCurrentUser} />
      </div>
    );
  }

  // 3. Main App
  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={() => setCurrentUser(null)}
    >
      {activeTab === 'home' && (
        <HomeDashboard 
          currentUser={currentUser} 
          users={state.users} 
          tasks={state.tasks}
          onUpdateUsers={(users) => handleUpdateState({ users })}
          onNavigate={setActiveTab}
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