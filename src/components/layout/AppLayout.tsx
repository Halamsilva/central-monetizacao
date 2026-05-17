import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  Menu,
  Bell,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Crown,
} from 'lucide-react';
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
  '/admin/notices': 'Gerenciar Avisos',
  '/admin/students': 'Gerenciar Alunos',
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();

  const currentTitle = pageTitles[location.pathname] || 'Central Monetização';

  const accessStatus = profile?.access_status || 'pending';

  const hasPremiumAccess = isAdmin || accessStatus === 'active';
  const isPending = !isAdmin && accessStatus === 'pending';
  const isBlocked = !isAdmin && accessStatus === 'blocked';

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
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-yellow-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-100 text-yellow-700">
              <Clock className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              Acesso em análise
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Seu cadastro foi recebido e está aguardando aprovação do administrador.
              Assim que for liberado, a biblioteca premium ficará disponível para você.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              Status atual: aguardando aprovação
            </div>

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
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-700">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              Acesso bloqueado
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Seu acesso à plataforma foi bloqueado. Caso acredite que isso foi
              um engano, entre em contato com o suporte ou administrador.
            </p>

            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              Status atual: acesso bloqueado
            </div>

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
    <div className="flex h-screen bg-[#F8FAFC]">
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-700 lg:hidden"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-bold text-slate-800">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 ${statusBadge.className}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusBadge.dotClassName}`}
              />

              <span className="text-xs font-semibold uppercase tracking-tight">
                {statusBadge.label}
              </span>
            </div>

            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {hasPremiumAccess ? (
              <Outlet />
            ) : (
              renderAccessGate()
            )}
          </div>
        </main>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100 px-6 text-[9px] font-medium text-slate-500">
          <div className="flex gap-4">
            <span>
              Status do Sistema:{' '}
              <span className="text-green-600">Online</span>
            </span>
            <span>Versão: v2.1.0-stable</span>
          </div>

          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-blue-600">
              Termos de Uso
            </a>
            <a href="#" className="transition-colors hover:text-blue-600">
              Políticas de Privacidade
            </a>
            <span>© 2024 Central Monetização</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;