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
  ChevronLeft
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { user, profile, isAdmin } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Avisos', icon: Bell, path: '/notices' },
    { name: 'Atualizações', icon: RefreshCw, path: '/updates' },
    { name: 'Agentes IA', icon: Bot, path: '/agents' },
    { name: 'Prompts Virais', icon: Zap, path: '/viral-prompts' },
    { name: 'TikTok Shop', icon: ShoppingBag, path: '/tiktok-shop' },
    { name: 'Facebook', icon: Facebook, path: '/facebook' },
    { name: 'YouTube Shorts', icon: Youtube, path: '/youtube-shorts' },
    { name: 'Ferramentas IA', icon: Wrench, path: '/tools-ia' },
    { name: 'Downloads', icon: Download, path: '/downloads' },
    { name: 'Perfil', icon: User, path: '/profile' },
    { name: 'Configurações', icon: Settings, path: '/settings' },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-[240px] h-full transform bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isOpen && "-translate-x-full lg:hidden"
      )}
    >
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
            CM
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">CENTRAL MONETIZAÇÃO</h1>
            <p className="text-[10px] font-semibold text-amber-600 tracking-wider mt-1">REDES SOCIAIS</p>
          </div>
        </div>
        <button
          onClick={toggle}
          className="lg:hidden text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, idx) => (
          <React.Fragment key={item.path}>
            {idx === 3 && (
              <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estratégias</div>
            )}
            <NavLink
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          </React.Fragment>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Administração</p>
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <ShieldCheck size={16} />
              Painel Admin
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Info Footer in Sidebar */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-amber-500 overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="text-slate-500" size={20} />
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'Halam Silva'}
            </p>

            <p className="text-[10px] text-slate-500 truncate">
              {profile?.email || user?.email || 'silvahalam@gmail.com'}
            </p>

          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
