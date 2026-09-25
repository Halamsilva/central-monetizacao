import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Film,
  MessageCircle,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Target,
  Wand2,
  Youtube,
} from 'lucide-react';
import { motion } from 'motion/react';

const learningPaths = [
  {
    title: 'Trilha TikTok Shop',
    description: 'Para encontrar produtos, criar ganchos e montar scripts de venda.',
    icon: ShoppingBag,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    steps: [
      { label: 'Criar ganchos de venda', path: '/tiktok-shop' },
    ],
  },
  {
    title: 'Trilha Videos com IA',
    description: 'Para criar cenas, revisar prompts e preparar videos no fluxo certo.',
    icon: Film,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    steps: [
      { label: 'Criar vídeos com IA', path: '/menina-da-roca' },
      { label: 'Baixar materiais prontos', path: '/downloads' },
    ],
  },
  {
    title: 'Trilha Redes Sociais',
    description: 'Para transformar ideias em conteudo para Facebook, YouTube e Shorts.',
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    steps: [
      { label: 'Buscar prompts virais', path: '/viral-prompts' },
      { label: 'Criar para Facebook', path: '/facebook' },
      { label: 'Criar para YouTube e Shorts', path: '/youtube-shorts' },
      { label: 'Baixar materiais prontos', path: '/downloads' },
    ],
  },
];

const quickWins = [
  'Use uma ferramenta por vez e salve o resultado antes de trocar de aba.',
  'Comece com produtos simples: beleza, cozinha, pet, casa e organizacao.',
  'Copie os melhores prompts para um bloco de notas com o nome do produto.',
  'Quando um gerador falhar, tente reduzir o texto ou trocar a chave/API configurada.',
];

const StartHere: React.FC = () => {
  return (
    <div className="space-y-6 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
              <Sparkles size={14} />
              Primeiro acesso
            </div>

            <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Comece aqui
            </h1>

            <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-600">
              Escolha uma trilha, siga a ordem das ferramentas e gere resultados
              sem ficar perdido dentro da plataforma.
            </p>
          </div>

          <Link
            to="/agents"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-blue-600"
          >
            Abrir biblioteca
            <ArrowRight size={17} />
          </Link>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-3">
        {learningPaths.map((path, index) => {
          const Icon = path.icon;

          return (
            <motion.article
              key={path.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-[26px] border ${path.border} bg-white p-5 shadow-sm`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${path.bg} ${path.color}`}>
                <Icon size={24} />
              </div>

              <h2 className="text-xl font-black text-slate-950">{path.title}</h2>
              <p className="mt-2 min-h-12 text-sm font-medium leading-relaxed text-slate-500">
                {path.description}
              </p>

              <div className="mt-5 space-y-2">
                {path.steps.map((step, stepIndex) => (
                  <Link
                    key={step.path}
                    to={step.path}
                    className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="flex items-center gap-3 text-sm font-black text-slate-800">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-500 shadow-sm">
                        {stepIndex + 1}
                      </span>
                      {step.label}
                    </span>
                    <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                  </Link>
                ))}
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Plano simples para hoje</h2>
              <p className="text-sm font-medium text-slate-500">
                Um jeito rapido de gerar algo util ainda no primeiro acesso.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Escolha uma trilha', text: 'TikTok Shop, videos com IA ou redes sociais.' },
              { icon: Wand2, title: 'Gere 3 versoes', text: 'Teste produtos, ganchos ou roteiros diferentes.' },
              { icon: PlayCircle, title: 'Execute fora da Central', text: 'Cole no Veo, editor ou rede social.' },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
                  <Icon size={20} className="text-blue-600" />
                  <h3 className="mt-3 text-sm font-black text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Avisos importantes</h2>
              <p className="text-sm font-medium text-slate-500">
                Pequenas regras para evitar erro e retrabalho.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {quickWins.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm font-semibold leading-relaxed text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600">
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Precisa de ajuda?</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                Se uma ferramenta der erro, anote o nome da aba, o produto usado
                e mande o print para o suporte. Assim fica mais rapido corrigir.
              </p>
            </div>
          </div>

          <Link
            to="/notices"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Ver novidades
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default StartHere;
