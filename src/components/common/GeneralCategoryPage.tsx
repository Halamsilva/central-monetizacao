import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, Bot, Zap, ArrowRight, Star } from 'lucide-react';
import { MOCK_AGENTS } from '../../lib/mockData';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface GeneralCategoryPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  category: string;
  description: string;
  gradient: string;
}

const GeneralCategoryPage: React.FC<GeneralCategoryPageProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  category, 
  description,
  gradient 
}) => {
  const categoryAgents = MOCK_AGENTS.filter(a => a.category === category || category === 'Todos');

  return (
    <div className="space-y-10">
      {/* Hero Section - Clean Minimalism style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[32px] p-10 text-white shadow-xl",
          gradient
        )}
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <Icon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h2>
            <p className="text-lg font-medium text-white/90">{subtitle}</p>
          </div>
          <p className="text-base text-white/80 leading-relaxed max-w-xl">
            {description}
          </p>
        </div>
        
        {/* Subtle Background Graphic */}
        <Icon 
          size={240} 
          className="absolute -bottom-10 -right-10 text-white opacity-5 rotate-12" 
        />
      </motion.div>

      {/* Agents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
            Agentes e Estratégias
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
            {categoryAgents.length} Disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryAgents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Bot size={20} />
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                    {agent.tag}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {agent.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                  {agent.description}
                </p>
              </div>
              <Link 
                to="/agents" 
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-bold text-slate-700 group-hover:bg-blue-700 group-hover:text-white transition-all"
              >
                Abrir Agente <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
          
          {/* Create Suggestion Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center hover:border-blue-300 transition-all min-h-[200px]"
          >
            <div className="mb-4 rounded-full bg-white p-3 shadow-sm text-blue-500">
              <Star size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Sugira um Agente</h4>
            <p className="text-[10px] text-slate-400 mb-6 px-4">Sentiu falta de algo? Nossa equipe cria novos agentes toda semana.</p>
            <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              Enviar sugestão <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GeneralCategoryPage;
