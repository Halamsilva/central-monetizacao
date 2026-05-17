import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'Central Monetização';

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

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-bold text-slate-800">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-full px-4 py-1.5 items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                Acesso Premium
              </span>
            </div>

            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between shrink-0 text-[9px] font-medium text-slate-500">
          <div className="flex gap-4">
            <span>
              Status do Sistema:{' '}
              <span className="text-green-600">Online</span>
            </span>
            <span>Versão: v2.1.0-stable</span>
          </div>

          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
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