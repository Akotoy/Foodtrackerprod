
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import React from "react";

const TabIcon = ({ active, label, icon }: { active: boolean, label: string, icon: string }) => (
  <div className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${active ? 'text-[var(--ios-blue)]' : 'text-[var(--ios-hint)]'}`}>
    <span className="text-2xl filter drop-shadow-sm">{icon}</span>
    <span className="text-[10px] font-medium tracking-tight leading-none">{label}</span>
  </div>
);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const haptic = () => {
    // @ts-ignore
    if (window.Telegram?.WebApp?.HapticFeedback) {
        // @ts-ignore
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  const tabs = [
    { path: "/home", label: "Главная", icon: "🏠" },
    { path: "/achievements", label: "Цели", icon: "🏆" },
    { path: "/scanner", label: "Скан", icon: "📸" }, 
    { path: "/ai-coach", label: "Коуч", icon: "💬" },
    { path: "/profile", label: "Профиль", icon: "👤" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[var(--tg-theme-secondary-bg-color)]">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        <Outlet />
      </div>

      {/* Floating Glass Dock */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dock pb-safe z-50 px-2 pt-2">
        <div className="flex justify-between items-center h-[60px]">
            {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            
            // Special styling for Scanner button
            if (tab.path === '/scanner') {
                return (
                <div key={tab.path} className="relative -top-6 flex flex-col items-center mx-1 cursor-pointer group" onClick={() => { haptic(); navigate(tab.path); }}>
                    <div className="w-14 h-14 rounded-full bg-[var(--ios-blue)] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform group-active:scale-90 border-[4px] border-[var(--tg-theme-secondary-bg-color)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                    </div>
                </div>
                )
            }

            return (
                <button 
                key={tab.path} 
                onClick={() => { haptic(); navigate(tab.path); }}
                className="flex-1 h-full flex items-center justify-center active:scale-95 transition-transform"
                >
                <TabIcon active={isActive} label={tab.label} icon={tab.icon} />
                </button>
            )
            })}
        </div>
      </nav>
    </div>
  );
}
