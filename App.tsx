// CHANGED FILE: App.tsx
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { HomeDashboard, TaskManager, FamilyManager, SetupWrapper } from './components/Views';
import { Login } from './components/Auth';
import { useAppState, StateProvider } from './components/StateProvider';
import { ThemeProvider } from './components/ThemeContext';
import { User } from './types';

// Define the tabs here so we can cast safely
export type TabId = 'home' | 'tasks' | 'family';

const AppContent: React.FC = () => {
  const { state, reload, setPartial } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // If we have no users (and we aren't loading), show setup
  const hasUsers = state.users.length > 0;

  if (!currentUser && hasUsers) {
    return (
      <>
        <Login
          users={state.users}
          onLogin={(user) => setCurrentUser(user)}
        />
        {/* Helper to reset if things get stuck */}
        <div className="fixed bottom-2 right-2 opacity-20 hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-xs p-2 bg-red-500 text-white rounded cursor-pointer"
          >
            Reset App
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <SetupWrapper />
      {currentUser && (
        <Layout
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={() => setCurrentUser(null)}
        >
          {activeTab === 'home' && (
            // CHANGED: Parents see overview, children see their weekly tasks here
            currentUser.role === 'parent' ? (
              <HomeDashboard
                currentUser={currentUser}
                users={state.users}
                tasks={state.tasks}
                onUpdateUsers={async () => {
                  await reload();
                }}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
              />
            ) : (
              <TaskManager
                currentUser={currentUser}
                users={state.users}
                tasks={state.tasks}
                onStateChange={(changes) => setPartial(changes)}
              />
            )
          )}

          {activeTab === 'tasks' && (
            <TaskManager
              currentUser={currentUser}
              users={state.users}
              tasks={state.tasks}
              onStateChange={(changes) => setPartial(changes)}
            />
          )}

          {activeTab === 'family' && (
            <FamilyManager
              users={state.users}
              onUpdateUsers={(updatedUsers) => setPartial({ users: updatedUsers })}
            />
          )}
        </Layout>
      )}
    </>
  );
};

export default function App() {
  return (
    <StateProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </StateProvider>
  );
}
