import React, { useState } from 'react';
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
  Scale,
  BookOpen,
  TrendingUp,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Play,
  X,
  MessageCircle,
  Sprout,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WHATSAPP_COMMUNITY_LINK } from '../lib/support';

const TUTORIAL_VIDEO_ID = 'eKRCEJ1CRtE';

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
  {
    title: 'Gordo para Magro',
    description: 'Transforme sua foto e acompanhe a evolução do corpo.',
    path: '/avatar-scale',
    icon: Scale,
    accent: 'bg-lime-100 text-lime-600',
  },
  {
    title: 'Reflexão do Velho da Roça',
    description: 'Reflexões profundas em áudio no estilo do Velho da Roça.',
    path: '/reflexao-velho-roca',
    icon: Heart,
    accent: 'bg-stone-100 text-stone-600',
  },
  {
    title: 'Novelinhas Gordos',
    description: 'Novelinhas dramáticas com personagens gordos.',
    path: '/novelinhas-gordos',
    icon: HeartHandshake,
    accent: 'bg-fuchsia-100 text-fuchsia-600',
  },
  {
    title: 'Upscale de Imagem',
    description: 'Aumente a resolução e o detalhe das suas imagens.',
    path: '/lumina-8k',
    icon: ImageIcon,
    accent: 'bg-cyan-100 text-cyan-600',
  },
  {
    title: 'TikTok Shop & Shopee',
    description: 'Roteiros e análise de produto para TikTok Shop e Shopee.',
    path: '/tiktok-shop-shopee',
    icon: ShoppingBag,
    accent: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Receitas p/ Ebook',
    description: 'Transforme seu ebook em receitas e vídeos de cuisine.',
    path: '/receitas-ebook',
    icon: BookOpen,
    accent: 'bg-yellow-100 text-yellow-600',
  },
  {
    title: 'Vender Encapsulados',
    description: 'Prompts e roteiros para vender encapsulados.',
    path: '/encapsulados',
    icon: Package,
    accent: 'bg-teal-100 text-teal-600',
  },
  {
    title: 'Radar TikTok Shop',
    description: 'Radar de produtos e tendências do TikTok Shop.',
    path: '/radar-tiktok-shop',
    icon: TrendingUp,
    accent: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Vídeos de Plantações',
    description: 'Roteiros de horta realista com prompts cinematográficos.',
    path: '/plantacoes',
    icon: Sprout,
    accent: 'bg-lime-100 text-lime-600',
  },
  {
    title: 'Vídeos de Limpeza',
    description: 'Campanhas de limpeza com prompts, roteiro e teleprompter.',
    path: '/limpeza',
    icon: Sparkles,
    accent: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'Gerador de Ganchos',
    description: 'Reescreve ganchos de novelinhas com falas de 9 segundos.',
    path: '/ganchos',
    icon: Flame,
    accent: 'bg-orange-100 text-orange-600',
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
  const [showTutorial, setShowTutorial] = useState(false);

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
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="group flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:gap-5 sm:p-5"
        >
          <span className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 sm:h-24 sm:w-44">
            <img
              src={`https://img.youtube.com/vi/${TUTORIAL_VIDEO_ID}/hqdefault.jpg`}
              alt="Como usar a plataforma"
              loading="lazy"
              className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
            />
            <span className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-110">
              <Play size={22} className="ml-0.5" fill="currentColor" />
            </span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600">
              <Youtube size={14} />
              Comece por aqui
            </span>
            <span className="mt-1 block text-base font-black text-slate-900 sm:text-lg">
              Como usar a plataforma
            </span>
            <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
              Video de 2 minutos: como cadastrar sua chave de IA e gerar seu primeiro roteiro.
            </span>
          </span>

          <ArrowRight size={20} className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500 sm:block" />
        </button>
      </section>

      <section>
        <a
          href={WHATSAPP_COMMUNITY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center gap-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:gap-5 sm:p-5"
        >
          <span className="flex h-20 w-32 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white sm:h-24 sm:w-44">
            <MessageCircle size={34} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
              Comunidade
            </span>
            <span className="mt-1 block text-base font-black text-slate-900 sm:text-lg">
              Grupo no WhatsApp
            </span>
            <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
              Entre no grupo da turmas para trocar ideias, tirar duvidas e acompanhar os lancamentos.
            </span>
          </span>

          <ArrowRight size={20} className="hidden shrink-0 text-emerald-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600 sm:block" />
        </a>
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

      {showTutorial && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Youtube size={18} className="text-red-600" />
                Como usar a plataforma
              </span>

              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar video"
              >
                <X size={20} />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${TUTORIAL_VIDEO_ID}?autoplay=1&rel=0`}
                title="Como usar a plataforma"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
