import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ExternalLink, Bot, Sparkles } from 'lucide-react';
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
    <div className="space-y-6 pb-6 sm:space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-7 text-white shadow-xl shadow-slate-900/15 sm:px-8 sm:py-9 lg:px-10 lg:py-12"
      >
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200 backdrop-blur">
            <Sparkles size={13} />
            Central Monetização
          </div>

          <h1 className="max-w-[11ch] text-[34px] font-black leading-[0.98] tracking-tight sm:max-w-none sm:text-5xl lg:text-6xl">
            Biblioteca de Agentes IA
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
            Acesse agentes especializados para TikTok Shop, Facebook,
            YouTube Shorts, prompts virais, copywriting e monetização.
          </p>

          <Link
            to="/agents"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 sm:h-14 sm:px-8"
          >
            Explorar Agentes
          </Link>
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
            <span className="h-5 w-1 rounded-full bg-blue-600" />
            Agentes em Destaque
          </h3>

          <Link
            to="/agents"
            className="shrink-0 text-sm font-bold text-blue-600 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-[28px] border border-slate-100 bg-white"
              />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Bot className="mx-auto mb-4 text-slate-400" size={42} />
            <h3 className="text-lg font-black text-slate-800">
              Nenhum agente cadastrado
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Adicione agentes pelo painel admin para aparecerem aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent, idx) => (
              <motion.article
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 sm:h-48">
                  {agent.image ? (
                    <img
                      src={agent.image}
                      alt={agent.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Bot className="text-white/70" size={42} />
                    </div>
                  )}

                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                    <span className="max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase text-blue-700 shadow-sm backdrop-blur">
                      {agent.category}
                    </span>

                    {agent.featured && (
                      <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase text-amber-950 shadow">
                        Premium
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="line-clamp-2 text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-blue-600">
                    {agent.title}
                  </h4>

                  <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-relaxed text-slate-500">
                    {agent.description}
                  </p>

                  <a
                    href={agent.agent_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-blue-600"
                  >
                    <ExternalLink size={17} />
                    Abrir Agente
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;