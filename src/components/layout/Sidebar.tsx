import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Shield,
  Boxes,
  Megaphone,
  Users,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  toggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const mainMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Avisos', icon: Bell, path: '/notices' },
    { title: 'Atualizações', icon: RefreshCw, path: '/updates' },
  ];

  const strategyMenu = [
    { title: 'Agentes IA', icon: Bot, path: '/agents' },
    { title: 'Prompts Virais', icon: Zap, path: '/viral-prompts' },
    { title: 'TikTok Shop', icon: ShoppingBag, path: '/tiktok-shop' },
    { title: 'Facebook', icon: Facebook, path: '/facebook' },
    { title: 'YouTube Shorts', icon: Youtube, path: '/youtube-shorts' },
    { title: 'Ferramentas IA', icon: Wrench, path: '/tools-ia' },
    { title: 'Downloads', icon: Download, path: '/downloads' },
    { title: 'Perfil', icon: User, path: '/profile' },
    { title: 'Configurações', icon: Settings, path: '/settings' },
  ];

  const adminMenu = [
    { title: 'Painel Admin', icon: Shield, path: '/admin' },
    { title: 'Gerenciar Agentes', icon: Boxes, path: '/admin/agents' },
    { title: 'Gerenciar Avisos', icon: Megaphone, path: '/admin/notices' },
    { title: 'Gerenciar Alunos', icon: Users, path: '/admin/students' },
  ];

  const renderMenuItem = (
    item: {
      title: string;
      icon: React.ElementType;
      path: string;
    }
  ) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${active
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <Icon size={20} />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
    >
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
            CM
          </div>

          <div>
            <h1 className="text-lg font-black leading-none text-slate-900">
              CENTRAL
              <br />
              MONETIZAÇÃO
            </h1>

            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-orange-500">
              Redes Sociais
            </p>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-2">
          {mainMenu.map(renderMenuItem)}
        </div>

        <div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Estratégias
          </p>

          <div className="space-y-2">
            {strategyMenu.map(renderMenuItem)}
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
              Administração
            </p>

            <div className="space-y-2">
              {adminMenu.map(renderMenuItem)}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-600">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">
              {profile?.full_name || 'Usuário'}
            </p>

            <p className="truncate text-xs text-slate-500">
              {profile?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;