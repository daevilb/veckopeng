import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, DEFAULT_STATE } from "../types";
import { fetchState, saveState } from "../services/api";

interface StateContextType {
  state: AppState;
  setPartial: (update: Partial<AppState>) => Promise<void>;
  reload: () => Promise<void>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load from backend on mount
  useEffect(() => {
    reload();
  }, []);

  const reload = async () => {
    const newState = await fetchState();
    setState(newState);
    setLoaded(true);
  };

  /**
   * Safely merge partial state updates.
   *
   * IMPORTANT:
   * We must use the functional form of setState so that
   * multiple calls in quick succession (e.g. updating
   * both users and tasks) don't overwrite each other.
   */
  const setPartial = async (update: Partial<AppState>) => {
    let mergedForSave: AppState = DEFAULT_STATE;

    setState((prev) => {
      const merged = { ...prev, ...update };
      mergedForSave = merged;
      return merged;
    });

    await saveState(mergedForSave);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse">✨</div>
          <p className="text-sm text-slate-400">Loading family data...</p>
        </div>
      </div>
    );
  }

  return (
    <StateContext.Provider value={{ state, setPartial, reload }}>
      {children}
    </StateContext.Provider>
  );
};

// Hook for components
export const useAppState = (): StateContextType => {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside <StateProvider>");
  }
  return ctx;
};
