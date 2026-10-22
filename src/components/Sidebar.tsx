import React from 'react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

export type ActiveTab = 'dashboard' | 'pacientes' | 'novo-paciente' | 'perfil-paciente';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  totalPacientes?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  totalPacientes = 0,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout, loading } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Visão geral e métricas',
    },
    {
      id: 'pacientes' as ActiveTab,
      label: 'Pacientes',
      icon: Users,
      badge: totalPacientes > 0 ? totalPacientes : null,
      description: 'Gestão de prontuários',
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white/95 backdrop-blur-xl border-r border-sky-100/80 shadow-lg shadow-sky-950/5">
      {/* Top Header with "Nutri APP" Logo */}
      <div className="p-6 border-b border-sky-100/70">
        <div className="flex items-center justify-between">
          <Logo size="sm" title="Nutri APP" subtitle="Gestão Nutricional" />
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[11px] font-bold text-sky-800/60 uppercase tracking-wider">
            Menu Principal
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/10 via-sky-500/15 to-cyan-500/10 text-sky-700 font-semibold shadow-sm border border-sky-200/60'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/25'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight">{item.label}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {item.description}
                  </span>
                </div>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-600 rounded-l-full" />
              )}
            </button>
          );
        })}

        {/* Status Callout */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/50 border border-sky-100/80">
          <div className="flex items-center gap-2 mb-1.5 text-sky-700 font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Neon Cloud Database</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Sincronização em tempo real de pacientes e consultas nutricionais.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL Conectado</span>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Area */}
      <div className="p-4 border-t border-sky-100/70 bg-slate-50/60">
        <div className="flex items-center gap-3 p-2 rounded-xl mb-2 hover:bg-white/80 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">
              {user?.name || 'Nutricionista'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 xl:w-72 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
