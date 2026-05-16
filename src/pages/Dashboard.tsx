import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MOCK_NOTICES, MOCK_AGENTS } from '../lib/mockData';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <span className="text-[11px] uppercase tracking-widest text-blue-300 font-bold">
          Central Monetização
        </span>

        <h1 className="text-3xl md:text-4xl font-black mt-3 leading-tight">
          Biblioteca de Agentes IA
        </h1>

        <p className="text-slate-300 mt-3 max-w-2xl text-sm leading-relaxed">
          Acesse agentes especializados para TikTok Shop, Facebook,
          YouTube Shorts, prompts virais, copywriting e monetização.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            to="/agents"
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-5 py-3 rounded-xl text-sm font-bold"
          >
            Explorar Agentes
          </Link>

          <Link
            to="/updates"
            className="bg-white/10 hover:bg-white/20 transition-colors text-white px-5 py-3 rounded-xl text-sm font-bold border border-white/10"
          >
            Últimas Atualizações
          </Link>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* AVISOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
              Avisos
            </h3>

            <Link
              to="/notices"
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {MOCK_NOTICES.slice(0, 2).map((notice, idx) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={cn(
                      'px-2 py-1 text-[10px] rounded-full font-bold uppercase',
                      notice.is_pinned
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {notice.is_pinned ? 'Fixado' : 'Novo'}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {new Date(notice.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  {notice.title}
                </h4>

                <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {notice.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AGENTES */}
        <div className="lg:col-span-2 space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              Agentes em Destaque
            </h3>

            <Link
              to="/agents"
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {MOCK_AGENTS.slice(0, 4).map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {agent.category}
                  </span>

                  <span
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-full font-bold uppercase',
                      agent.tag === 'NOVO'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    )}
                  >
                    {agent.tag}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {agent.title}
                </h4>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {agent.description}
                </p>

                <div className="mt-5">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-bold py-3 rounded-xl">
                    Abrir Agente
                  </button>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;