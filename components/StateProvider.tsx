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

  // Ladda initial state från backend vid start
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    try {
      const newState = await fetchState();
      setState(newState);
    } catch (error) {
      console.error("Failed to fetch state:", error);
      // Fallback så appen fortfarande funkar
      setState(DEFAULT_STATE);
    } finally {
      setLoaded(true);
    }
  };

  /**
   * Säkert sätt att uppdatera delar av state.
   *
   * - Använder funktionell setState(prev => ...) så att flera snabba
   *   uppdateringar inte skriver över varandra.
   * - Mergar partial state med tidigare state.
   * - Sparar det mergade statet till backend.
   *
   * Det här fixar buggen där uppdatering av users kunde tappas bort
   * när tasks uppdaterades direkt efteråt.
   */
  const setPartial = async (update: Partial<AppState>) => {
    let mergedForSave: AppState = DEFAULT_STATE;

    setState((prev) => {
      const merged: AppState = {
        ...prev,
        ...update,
      };
      mergedForSave = merged;
      return merged;
    });

    try {
      await saveState(mergedForSave);
    } catch (error) {
      console.error("Failed to save state:", error);
      // Här skulle man kunna lägga till retry / toast i framtiden
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">💰</div>
          <p className="text-sm font-medium text-slate-100">
            Loading your family&apos;s Veckopeng…
          </p>
          <p className="text-xs text-slate-500">
            Fetching tasks, balances and members from storage.
          </p>
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

export const useAppState = (): StateContextType => {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside a StateProvider");
  }
  return ctx;
};
