import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  RefreshCw,
  Bot,
  Zap,
  ShoppingBag,
  Facebook,
  Youtube,
  Wrench,
  Download,
  User,
  Settings,
  ShieldCheck,
  ChevronLeft,
  Megaphone,
  Boxes
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggle,
}) => {
  const { profile, isAdmin } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      name: 'Avisos',
      icon: Bell,
      path: '/notices',
    },
    {
      name: 'Atualizações',
      icon: RefreshCw,
      path: '/updates',
    },

    {
      name: 'Agentes IA',
      icon: Bot,
      path: '/agents',
    },
    {
      name: 'Prompts Virais',
      icon: Zap,
      path: '/viral-prompts',
    },
    {
      name: 'TikTok Shop',
      icon: ShoppingBag,
      path: '/tiktok-shop',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      path: '/facebook',
    },
    {
      name: 'YouTube Shorts',
      icon: Youtube,
      path: '/youtube-shorts',
    },
    {
      name: 'Ferramentas IA',
      icon: Wrench,
      path: '/tools-ia',
    },
    {
      name: 'Downloads',
      icon: Download,
      path: '/downloads',
    },
    {
      name: 'Perfil',
      icon: User,
      path: '/profile',
    },
    {
      name: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 w-[240px] h-full transform bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
        !isOpen && '-translate-x-full lg:hidden'
      )}
    >
      {/* LOGO */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
            CM
          </div>

          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              CENTRAL MONETIZAÇÃO
            </h1>

            <p className="text-[10px] font-semibold text-amber-600 tracking-wider mt-1">
              REDES SOCIAIS
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          className="lg:hidden text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, idx) => (
          <React.Fragment key={item.path}>
            {idx === 3 && (
              <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estratégias
              </div>
            )}

            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          </React.Fragment>
        ))}

        {/* ADMIN */}
        {isAdmin && (
          <div className="pt-5 mt-5 border-t border-slate-100">
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Administração
            </div>

            <div className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )
                }
              >
                <ShieldCheck size={16} />
                Painel Admin
              </NavLink>

              <NavLink
                to="/admin/agents"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )
                }
              >
                <Boxes size={16} />
                Gerenciar Agentes
              </NavLink>

              <NavLink
                to="/admin/notices"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )
                }
              >
                <Megaphone size={16} />
                Gerenciar Avisos
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* FOOTER USER */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {profile?.full_name || 'Usuário'}
            </p>

            <p className="text-xs text-slate-500 truncate">
              {profile?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;