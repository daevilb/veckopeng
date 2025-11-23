import React, { useEffect, useState } from "react";
import {
  Home,
  CheckSquare,
  Users,
  Sun,
  Moon,
  LogOut,
  Smartphone,
  Coffee,
} from "lucide-react";
import { Member } from "../types";
import { useTheme } from "../utils/theme";

type TabId = "home" | "tasks" | "family";

interface LayoutProps {
  children: React.ReactNode;
  currentUser: Member;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Tabs are defined once and do not disappear when clicking around
  const tabs: { id: TabId; label: string; icon: React.ComponentType<any>; show: boolean }[] = [
    {
      id: "home",
      label: currentUser.role === "parent" ? "Overview" : "My Week",
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
      show: currentUser.role === "parent",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const visibleTabs = tabs.filter((t) => t.show);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isParent = currentUser.role === "parent";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar (desktop + mobile) */}
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
                  {currentUser.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Buy Me a Coffee link – only for parents */}
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

            {/* Theme toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4 text-slate-200" />
              )}
            </button>

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
                  className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition
                    ${
                      isActive
                        ? "text-emerald-300"
                        : "text-slate-400 hover:text-slate-100"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
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
                className={`flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium transition
                  ${
                    isActive
                      ? "text-emerald-300"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
