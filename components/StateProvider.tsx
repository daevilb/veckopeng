import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, DEFAULT_STATE, User, Task } from '../types';
import { fetchState } from '../services/api';

interface AppStateContextType {
  state: AppState;
  reload: () => Promise<void>;
  setPartial: (changes: Partial<AppState>) => void;
}

const AppStateContext = createContext<AppStateContextType>({
  state: DEFAULT_STATE,
  reload: async () => {},
  setPartial: () => {},
});

export const useAppState = () => useContext(AppStateContext);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  // 1. Fetch from Backend on Mount
  const reload = useCallback(async () => {
    try {
      const serverState = await fetchState();
      setState(serverState);
    } catch (error) {
      console.error("Failed to load state from server:", error);
    }
  }, []);

  useEffect(() => {
    reload();
    
    // Optional: Poll every 5 seconds to keep devices in sync
    const interval = setInterval(reload, 5000);
    return () => clearInterval(interval);
  }, [reload]);

  // 2. Optimistic Updates (Update UI immediately, backend handles persistence via api.ts calls)
  const setPartial = (changes: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...changes }));
  };

  return (
    <AppStateContext.Provider value={{ state, reload, setPartial }}>
      {children}
    </AppStateContext.Provider>
  );
};