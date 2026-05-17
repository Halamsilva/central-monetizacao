import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ExternalLink, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Agent {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  agent_link: string;
  prompt: string;
  featured: boolean;
}

const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error(error);
        return;
      }

      setAgents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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

      <div className="space-y-4">
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 bg-white border border-slate-100 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <Bot className="mx-auto mb-4 text-slate-400" size={42} />
            <h3 className="text-lg font-bold text-slate-800">
              Nenhum agente cadastrado
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Adicione agentes pelo painel admin para aparecerem aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl overflow-hidden transition-all group"
              >
                <div className="relative h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden">
                  {agent.image ? (
                    <img
                      src={agent.image}
                      alt={agent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Bot className="text-white/70" size={42} />
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-white/90 backdrop-blur px-3 py-1 rounded-full">
                      {agent.category}
                    </span>
                  </div>

                  {agent.featured && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-bold uppercase bg-amber-400 text-amber-900 px-3 py-1 rounded-full shadow">
                        Premium
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {agent.title}
                  </h4>

                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed min-h-[44px]">
                    {agent.description}
                  </p>

                  <div className="mt-5">
                    <a
                      href={agent.agent_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-bold rounded-2xl"
                    >
                      <ExternalLink size={17} />
                      Abrir Agente
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;