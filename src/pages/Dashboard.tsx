import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Bot,
  ShoppingBag,
  Youtube,
  Facebook,
  Zap,
  Sparkles,
  Flame,
} from 'lucide-react';

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

const categories = [
  {
    title: 'TikTok Shop',
    icon: ShoppingBag,
    link: '/tiktok-shop',
  },
  {
    title: 'Facebook',
    icon: Facebook,
    link: '/facebook',
  },
  {
    title: 'YouTube',
    icon: Youtube,
    link: '/youtube-shorts',
  },
  {
    title: 'Prompts',
    icon: Zap,
    link: '/viral-prompts',
  },
];

const AgentImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <Bot className="text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
};

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
        .limit(9);

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
    <div className="space-y-5 pb-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-200 backdrop-blur">
            <Sparkles size={12} />
            Central Monetização
          </div>

          <h1 className="max-w-[10ch] text-3xl font-black leading-none tracking-tight">
            Biblioteca IA
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Agentes premium para monetização, TikTok Shop,
            Shorts, UGC e prompts virais.
          </p>

          <Link
            to="/agents"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
          >
            Explorar Agora
          </Link>
        </div>
      </motion.section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
            Categorias
          </h3>

          <Link
            to="/agents"
            className="text-xs font-bold text-blue-600"
          >
            Ver tudo
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.title}
                to={category.link}
                className="group rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon size={18} />
                </div>

                <h4 className="mt-3 text-[11px] font-black leading-tight text-slate-900">
                  {category.title}
                </h4>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
            <Flame size={16} className="text-orange-500" />
            Em Destaque
          </h3>

          <Link
            to="/agents"
            className="text-xs font-bold text-blue-600"
          >
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, idx) => (
              <motion.article
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-28 overflow-hidden bg-slate-100">
                  <AgentImage src={agent.image} alt={agent.title} />

                  <div className="absolute left-2 top-2">
                    <span className="rounded-full bg-white/95 px-2 py-1 text-[8px] font-black uppercase text-blue-700 shadow">
                      {agent.category}
                    </span>
                  </div>
                </div>

                <div className="p-2.5">
                  <h4 className="line-clamp-2 text-[11px] font-black leading-tight text-slate-900">
                    {agent.title}
                  </h4>

                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                    {agent.description}
                  </p>

                  <a
                    href={agent.agent_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ferramenta externa ${agent.title}`}
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-2xl bg-slate-950 text-[10px] font-black text-white transition hover:bg-blue-600"
                  >
                    <ExternalLink size={12} />
                    Abrir ferramenta
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
