import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, Clock, Moon, ShieldAlert, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/notices': 'Novidades',
  '/updates': 'Atualizações',
  '/agents': 'Agentes IA',
  '/viral-prompts': 'Prompts Virais',
  '/tiktok-shop': 'TikTok Shop',
  '/facebook': 'Facebook',
  '/youtube-shorts': 'YouTube Shorts',
  '/tools-ia': 'Ferramentas IA',
  '/downloads': 'Downloads',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/admin': 'Painel Admin',
  '/admin/agents': 'Gerenciar Agentes',
    '/shop-vip': 'Loja VIP',
  '/admin/notices': 'Gerenciar Avisos',
  '/admin/students': 'Gerenciar Alunos',
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('central-theme');

    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const currentTitle = pageTitles[location.pathname] || 'Central Monetização';
  const accessStatus = profile?.access_status || 'pending';
  const visibleUnreadCount = location.pathname === '/notices' ? 0 : unreadCount;

  const hasPremiumAccess = isAdmin || accessStatus === 'active';
  const isPending = !isAdmin && accessStatus === 'pending';
  const isBlocked = !isAdmin && accessStatus === 'blocked';

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchNotificationCount();

    const channel = supabase
      .channel('topbar-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => setUnreadCount((current) => current + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/notices') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow =
      window.innerWidth < 1024 && sidebarOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('central-theme', theme);
  }, [theme]);

  const currentYear = new Date().getFullYear();

  const statusBadge = (() => {
    if (isAdmin) {
      return {
        label: 'Admin Premium',
        className: 'bg-blue-100 text-blue-700',
        dotClassName: 'bg-blue-500',
      };
    }

    if (accessStatus === 'active') {
      return {
        label: 'Acesso Premium',
        className: 'bg-slate-100 text-slate-600',
        dotClassName: 'bg-green-500',
      };
    }

    if (accessStatus === 'blocked') {
      return {
        label: 'Acesso Bloqueado',
        className: 'bg-red-100 text-red-700',
        dotClassName: 'bg-red-500',
      };
    }

    return {
      label: 'Em Análise',
      className: 'bg-yellow-100 text-yellow-700',
      dotClassName: 'bg-yellow-500',
    };
  })();

  const renderAccessGate = () => {
    if (isPending) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-2">
          <div className="w-full max-w-2xl rounded-3xl border border-yellow-200 bg-white p-5 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-100 text-yellow-700">
              <Clock className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Acesso em análise
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
              Seu cadastro foi recebido e está aguardando aprovação do administrador.
            </p>

            <button
              onClick={signOut}
              className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Sair da conta
            </button>
          </div>
        </div>
      );
    }

    if (isBlocked) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-2">
          <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-5 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-700">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Acesso bloqueado
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
              Seu acesso à plataforma foi bloqueado.
            </p>

            <button
              onClick={signOut}
              className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Sair da conta
            </button>
          </div>
        </div>
      );
    }

    return <Outlet />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#F8FAFC] transition-colors dark:bg-black">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 transition-colors sm:h-16 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-black">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={21} />
            </button>

            <h2 className="truncate text-sm font-black text-slate-800 sm:text-lg">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`hidden items-center gap-2 rounded-full px-4 py-1.5 sm:flex ${statusBadge.className}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusBadge.dotClassName}`} />
              <span className="text-xs font-semibold uppercase tracking-tight">
                {statusBadge.label}
              </span>
            </div>

            <Link
              to="/notices"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={
                visibleUnreadCount > 0
                  ? `Abrir notificações, ${visibleUnreadCount} não lidas`
                  : 'Abrir notificações'
              }
            >
              <Bell size={19} />
              {visibleUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                  {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              type="button"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-2 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {hasPremiumAccess ? <Outlet /> : renderAccessGate()}
          </div>
        </main>

        <footer className="hidden h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100 px-6 text-[9px] font-medium text-slate-500 sm:flex dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
          <span>
            Status do Sistema: <span className="text-green-600">Online</span>
          </span>

          <span>© {currentYear} Central Monetização</span>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
