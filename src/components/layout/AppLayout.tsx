import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/notices': 'Avisos',
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

  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();

  const currentTitle = pageTitles[location.pathname] || 'Central Monetização';
  const accessStatus = profile?.access_status || 'pending';

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
    document.body.style.overflow =
      window.innerWidth < 1024 && sidebarOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

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
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:h-16 sm:px-6 lg:px-8">
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

            <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <Bell size={19} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-2 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {hasPremiumAccess ? <Outlet /> : renderAccessGate()}
          </div>
        </main>

        <footer className="hidden h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100 px-6 text-[9px] font-medium text-slate-500 sm:flex">
          <span>
            Status do Sistema: <span className="text-green-600">Online</span>
          </span>

          <span>© 2025 Central Monetização</span>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
