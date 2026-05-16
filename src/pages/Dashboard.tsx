import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Bot, 
  Video, 
  ArrowRight,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_NOTICES, MOCK_AGENTS } from '../lib/mockData';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Agentes Disponíveis', value: '42', info: '+3 novos essa semana', type: 'info' },
    { name: 'Downloads Realizados', value: '15', info: 'Arquivos e Templates', type: 'subtle' },
    { name: 'Última Atualização', value: 'v2.1', info: 'Ontem, às 14:30', type: 'accent' },
    { name: 'Suporte Prioritário', value: 'Precisa de ajuda?', info: 'Abrir Chamado', type: 'action' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-5 rounded-xl shadow-sm border",
              stat.type === 'action' 
                ? "bg-blue-700 border-blue-800 text-white" 
                : "bg-white border-slate-100"
            )}
          >
            <p className={cn(
              "text-[10px] font-bold uppercase",
              stat.type === 'action' ? "text-blue-200" : "text-slate-400"
            )}>
              {stat.name}
            </p>
            <p className={cn(
              "mt-1 font-black",
              stat.type === 'action' ? "text-lg leading-tight" : "text-2xl text-slate-800"
            )}>
              {stat.value}
            </p>
            {stat.type === 'action' ? (
              <button className="mt-3 text-[10px] bg-white text-blue-700 font-black py-1.5 px-3 rounded uppercase transition-transform active:scale-95">
                {stat.info}
              </button>
            ) : (
              <div className={cn(
                "mt-2 text-xs font-medium",
                stat.type === 'info' ? "text-blue-600" : stat.type === 'accent' ? "text-brand-amber" : "text-slate-500"
              )}>
                {stat.info}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Notices */}
        <div className="col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-amber rounded-full"></span>
              Avisos Importantes
            </h3>
            <Link to="/notices" className="text-xs text-blue-600 hover:underline font-semibold">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {MOCK_NOTICES.slice(0, 3).map((notice, idx) => (
              <motion.div 
                key={notice.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "px-2 py-0.5 text-[9px] font-bold rounded uppercase",
                    notice.is_pinned ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {notice.is_pinned ? 'Fixado' : 'Novidade'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(notice.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-2">{notice.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{notice.content}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Featured AI Agents */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              Agentes de IA em Destaque
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Pesquisar agente..." 
                className="text-[11px] px-3 py-1 border border-slate-200 rounded-lg w-40 outline-none focus:border-blue-300 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_AGENTS.slice(0, 4).map((agent, idx) => (
              <motion.div 
                key={agent.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{agent.category}</span>
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded uppercase",
                      agent.tag === 'NOVO' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}>
                      {agent.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{agent.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{agent.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[9px] text-slate-400">Atualizado recentemente</div>
                  <button className="text-[10px] font-bold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-lg hover:bg-blue-100 transition-colors active:scale-95">
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
