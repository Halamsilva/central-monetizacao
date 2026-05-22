import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Bot,
  Zap,
  ShoppingBag,
  Facebook,
  Youtube,
  Wrench,
  BookOpen,
  Camera,
  Film,
  Download,
  User,
  Settings,
  Shield,
  Boxes,
  Megaphone,
  Users,
  LogOut,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen?: boolean;
  toggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  toggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const visibleUnreadCount = location.pathname === '/notices' ? 0 : unreadCount;

  // Link do som de notificação (estilo push/ping moderno e limpo)
  const audioUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav';

  // Monitora notifications em tempo real no Supabase
  useEffect(() => {
    // 1. Busca a contagem inicial de notificações existentes
    const fetchNotificationCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchNotificationCount();

    // 2. Escuta em tempo real quando você insere um novo agente ou aviso
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          setUnreadCount((prev) => prev + 1);

          // MÁGICA DO SOM: Toca o efeito sonoro na hora que o registro entra no banco
          try {
            const audio = new Audio(audioUrl);
            audio.volume = 0.5; // Volume em 50% para não dar um susto no aluno
            audio.play();
          } catch (audioError) {
            console.log('Navegador bloqueou o som automático até o usuário clicar na tela.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Limpa o contador vermelho quando o aluno clica na aba de Avisos
  useEffect(() => {
    if (location.pathname === '/notices') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const userInitial =
    profile?.full_name?.charAt(0)?.toUpperCase() || 'U';

  const showAvatar =
    Boolean(profile?.avatar_url) && !avatarFailed;

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleNavigate = () => {
    if (window.innerWidth < 1024 && toggle) {
      toggle();
    }
  };

  const mainMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Novidades', icon: Bell, path: '/notices', badge: true },
  ];

  const strategyMenu = [
    { title: 'Agentes IA', icon: Bot, path: '/agents' },
    { title: 'Loja VIP', icon: ShoppingBag, path: '/shop-vip' }, // <-- Movida para o topo com o máximo de destaque!
    { title: 'Prompts Virais', icon: Zap, path: '/viral-prompts' },
    { title: 'TikTok Shop', icon: ShoppingBag, path: '/tiktok-shop' },
    { title: 'TikTok Persuasivo', icon: ShoppingBag, path: '/tiktok-shop-persuasivo' },
    { title: 'Facebook', icon: Facebook, path: '/facebook' },
    { title: 'YouTube e Shorts', icon: Youtube, path: '/youtube-shorts' },
    { title: 'Ferramentas IA', icon: Wrench, path: '/tools-ia' },
    { title: 'Fábrica de Novelinhas', icon: BookOpen, path: '/novelinhas' },
    { title: 'POV Vendas', icon: Camera, path: '/pov' },
    { title: 'Revisor Veo 3', icon: Film, path: '/revisor-veo-3' },
    { title: 'Menina da Roca', icon: Camera, path: '/menina-da-roca' },
    { title: 'Downloads', icon: Download, path: '/downloads' },
    { title: 'Perfil', icon: User, path: '/profile' },
    { title: 'Configurações', icon: Settings, path: '/settings' },
  ];

  const primaryStrategyMenu = [strategyMenu[0], strategyMenu[1], strategyMenu[12]];
  const agentToolsMenu = [
    strategyMenu[2],
    strategyMenu[4],
    strategyMenu[9],
    strategyMenu[8],
    strategyMenu[10],
    strategyMenu[11],
    strategyMenu[3],
    strategyMenu[5],
    strategyMenu[6],
    strategyMenu[7],
  ];
  const accountMenu = [strategyMenu[13], strategyMenu[14]];

  const adminMenu = [
    { title: 'Painel Admin', icon: Shield, path: '/admin' },
    { title: 'Gerenciar Agentes', icon: Boxes, path: '/admin/agents' },
    { title: 'Gerenciar Avisos', icon: Megaphone, path: '/admin/notices' },
    { title: 'Gerenciar Alunos', icon: Users, path: '/admin/students' },
  ];

  const renderMenuItem = (item: {
    title: string;
    icon: React.ElementType;
    path: string;
    badge?: boolean;
  }) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={handleNavigate}
        className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${active
          ? 'bg-blue-50 text-blue-600 shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon
            size={20}
            className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'
              }`}
          />
          <span>{item.title}</span>
        </div>

        {/* Bolinha vermelha com a contagem de notificações não lidas */}
        {item.badge && visibleUnreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white animate-bounce shadow-sm">
            {visibleUnreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-[88%] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:static lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-500/20 sm:h-14 sm:w-14 sm:text-lg">
            CM
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black leading-none text-slate-900">
              CENTRAL
              <br />
              MONETIZAÇÃO
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-orange-500">
              Redes Sociais
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={22} />
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <div className="space-y-2">
          {mainMenu.map(renderMenuItem)}
        </div>

        <div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Estratégias
          </p>
          <div className="space-y-2">
            {primaryStrategyMenu.map(renderMenuItem)}
          </div>
        </div>

        <div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Agentes
          </p>
          <div className="space-y-2">
            {agentToolsMenu.map(renderMenuItem)}
          </div>
        </div>

        <div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Conta
          </p>
          <div className="space-y-2">
            {accountMenu.map(renderMenuItem)}
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

      <div className="border-t border-slate-100 bg-white p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-black text-slate-600 ring-2 ring-slate-100">
            {showAvatar ? (
              <img
                src={profile?.avatar_url || ''}
                alt={profile?.full_name || 'Usuário'}
                onError={() => setAvatarFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black text-slate-900">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="truncate text-sm text-slate-500">
              {profile?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
          aria-label="Sair da conta"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
