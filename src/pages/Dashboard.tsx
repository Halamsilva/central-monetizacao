import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MOCK_AGENTS } from '../lib/mockData';
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
        </div>
      </motion.div>

      {/* AGENTES */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
            Agentes Disponíveis
          </h3>

          <Link
            to="/agents"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {MOCK_AGENTS.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
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
                <a
                  href={agent.agent_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-bold py-3 rounded-xl"
                >
                  Abrir Agente
                </a>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;