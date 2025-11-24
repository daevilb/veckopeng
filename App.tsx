import React, { useState } from 'react';
import { StateProvider, useAppState } from './components/StateProvider';
import { Setup, Login } from './components/Auth';
import { Layout } from './components/Layout';
import { HomeDashboard, TaskManager, FamilyManager } from './components/Views';
import { ThemeProvider } from './components/ThemeContext';
import { User } from './types';

function InnerApp() {
  const { state, setPartial } = useAppState();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'family'>('home');

  // ---- FIRST RUN ----
  if (state.users.length === 0) {
    return (
      <Setup
        isFirstRun={true}
        onComplete={async (newUser) => {
          await setPartial({ users: [newUser] });
          setCurrentUser(newUser);
        }}
      />
    );
  }

  // ---- LOGIN ----
  if (!currentUser) {
    return (
      <Login
        users={state.users}
        onLogin={(u) => {
          setCurrentUser(u);
          setActiveTab('home');
        }}
      />
    );
  }

  // ---- MAIN APP ----
  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as any)}
      onLogout={() => setCurrentUser(null)}
    >
      {activeTab === 'home' && (
        <HomeDashboard
          currentUser={currentUser}
          users={state.users}
          tasks={state.tasks}
          onUpdateUsers={(users) => setPartial({ users })}
          onNavigate={(tab) => setActiveTab(tab as any)}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskManager
          currentUser={currentUser}
          users={state.users}
          tasks={state.tasks}
          onStateChange={(partial) => setPartial(partial)}
        />
      )}

      {activeTab === 'family' && currentUser.role === 'parent' && (
        <FamilyManager
          users={state.users}
          onUpdateUsers={(users) => setPartial({ users })}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StateProvider>
        <InnerApp />
      </StateProvider>
    </ThemeProvider>
  );
}
