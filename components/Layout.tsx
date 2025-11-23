import React, { useEffect, useState } from "react";
import { Home, CheckSquare, Users, LogOut, Smartphone, Coffee } from "lucide-react";
import { useAppState } from "./StateProvider";

type TabConfig = {
  id: string;
  label: string;
  show: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

interface LayoutProps {
  children: React.ReactNode;
  currentUser: any; // generic to avoid mismatch with types.ts
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

// Named export (used by App.tsx: `import { Layout } from "./components/Layout"`)
export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { state } = useAppState();

  // Count tasks that are relevant for the current user:
  // - Parent: tasks waiting_for_approval
  // - Child: own tasks that are still pending
  const pendingCount =
    state?.tasks?.filter((t: any) => {
      if (!currentUser) return false;
      if (currentUser.role === "parent") {
        return t.status === "waiting_for_approval";
      } else {
        return t.assignedToId === currentUser.id && t.status === "pending";
      }
    }).length ?? 0;

  // Tabs are stable and never disappear when clicking around.
  // Only rule: "Family" is visible for parents, hidden for children.
  const tabs: TabConfig[] = [
    {
      id: "home",
      label: currentUser?.role === "parent" ? "Overview" : "My Week",
      icon: Home,
      show: true,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      show: true,
    },
    {
      id: "family",
      label: "Family",
      icon: Users,
      show: currentUser?.role === "parent",
    },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isParent = currentUser?.role === "parent";

  const renderTabLabel = (tabId: string, label: string) => {
    if (tabId !== "tasks" || pendingCount <= 0) {
      return <span>{label}</span>;
    }

    return (
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 px-1">
          {pendingCount}
        </span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar */}
      <header
        className={`sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur ${
          isScrolled ? "shadow-lg shadow-slate-900/50" : ""
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm sm:text-base">
                  Veckopeng
                </h1>
                {isParent && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <Smartphone className="h-3 w-3" />
                    Parent mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Signed in as{" "}
                <span className="font-medium text-slate-100">
                  {currentUser?.name ?? "Unknown"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Buy Me a Coffee – only for parents */}
            {isParent && (
              <a
                href="https://www.buymeacoffee.com/daevilb"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 transition"
              >
                <Coffee className="h-3 w-3" />
                Support dev
              </a>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-600/60 bg-red-900/40 hover:bg-red-800/70 transition"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 text-red-200" />
            </button>
          </div>
        </div>

        {/* Desktop tab navigation */}
        <nav className="hidden md:block border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "text-emerald-300"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {renderTabLabel(tab.id, tab.label)}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400" />
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
          </div>
        </nav>
      </header>

      {/* Main content area */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-4 pb-20 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
        <div className="max-w-5xl mx-auto flex items-stretch justify-around">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? "text-emerald-300"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                {renderTabLabel(tab.id, tab.label)}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Also provide default export in case you ever change import style
export default Layout;
