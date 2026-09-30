import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  FileVideo,
  Film,
  ChefHat,
  Bug,
  Package,
  Video,
  ShoppingBag,
  Download,
  Youtube,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Boxes,
  Users,
  Megaphone,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tool = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  accent: string;
};

const tools: Tool[] = [
  {
    title: 'Menina da Roça',
    description: 'Vídeos virais de retenção emocional no estilo rural.',
    path: '/menina-da-roca',
    icon: Camera,
    accent: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Clonagem de Vídeo',
    description: 'Analise e clone qualquer vídeo com prompts forenses.',
    path: '/clonagem-video',
    icon: FileVideo,
    accent: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Novelinhas Universal',
    description: 'Crie novelinhas dramáticas prontas para viralizar.',
    path: '/novelinhas',
    icon: Film,
    accent: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Mestre 30s',
    description: 'Receitas e pratos em vídeos curtos de 30 segundos.',
    path: '/mestre-30s',
    icon: ChefHat,
    accent: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Receitas Anti-Pragas',
    description: 'Vídeos de receitas caseiras contra pragas.',
    path: '/insetos',
    icon: Bug,
    accent: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'POV Produto',
    description: 'Vídeos POV focados nos benefícios do produto.',
    path: '/pov-produto',
    icon: Package,
    accent: 'bg-rose-100 text-rose-600',
  },
  {
    title: 'TikTok Shop Seedance',
    description: 'Prompts prontos para vender no TikTok Shop.',
    path: '/seedance',
    icon: Video,
    accent: 'bg-sky-100 text-sky-600',
  },
];

const quickLinks = [
  { title: 'Loja VIP', description: 'Materiais e pacotes exclusivos.', path: '/shop-vip', icon: ShoppingBag, accent: 'bg-indigo-100 text-indigo-600' },
  { title: 'Downloads', description: 'Aplicativos e ferramentas prontas.', path: '/downloads', icon: Download, accent: 'bg-teal-100 text-teal-600' },
  { title: 'Tutoriais', description: 'Aulas passo a passo em vídeo.', path: '/tutoriais', icon: Youtube, accent: 'bg-red-100 text-red-600' },
];

const adminLinks = [
  { title: 'Painel Admin', path: '/admin', icon: ShieldCheck },
  { title: 'Gerenciar Agentes', path: '/admin/agents', icon: Boxes },
  { title: 'Gerenciar Avisos', path: '/admin/notices', icon: Megaphone },
  { title: 'Gerenciar Alunos', path: '/admin/students', icon: Users },
  { title: 'Página de Assinatura', path: '/admin/assinatura', icon: Settings },
];

const Home: React.FC = () => {
  const { profile, isAdmin } = useAuth();

  const firstName = (profile?.full_name || '').trim().split(' ')[0];
  const accessStatus = profile?.access_status || 'pending';

  const statusBadge = isAdmin
    ? { label: 'Admin', className: 'bg-blue-100 text-blue-700' }
    : accessStatus === 'active'
      ? { label: 'Acesso ativo', className: 'bg-emerald-100 text-emerald-700' }
      : accessStatus === 'blocked'
        ? { label: 'Acesso bloqueado', className: 'bg-red-100 text-red-700' }
        : { label: 'Em análise', className: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur">
            <Sparkles size={13} />
            Central Monetização
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${statusBadge.className}`}>
            {isAdmin ? <ShieldCheck size={13} /> : <Clock size={13} />}
            {statusBadge.label}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">
          {firstName ? `Olá, ${firstName}!` : 'Bem-vindo(a)!'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-blue-50 sm:text-base">
          Escolha uma ferramenta abaixo para começar a criar seus vídeos virais.
          Cada agente gera prompts e roteiros prontos para as IAs de vídeo.
        </p>

        <Link
          to="/menina-da-roca"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
        >
          Começar agora
          <ArrowRight size={17} />
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-base font-black text-slate-900 sm:text-lg">Ferramentas de vídeo</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tool.accent}`}>
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-900">{tool.title}</span>
                    <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500">
                    {tool.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-base font-black text-slate-900 sm:text-lg">Materiais e extras</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${link.accent}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-900">{link.title}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{link.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {isAdmin && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base font-black text-slate-900 sm:text-lg">Administração</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                >
                  <Icon size={17} className="shrink-0 text-slate-400" />
                  <span className="truncate">{link.title}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
