import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ExternalLink,
  Copy,
  Search,
  Sparkles,
  X,
  Check,
  Loader2,
  Star,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  created_at?: string;
}

const normalizeText = (value?: string) => {
  return value?.trim().toLowerCase() || '';
};

const formatCategoryLabel = (category?: string) => {
  if (!category) return 'Sem Categoria';

  return category
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage('');
    }, 2500);
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

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

  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>();

    agents.forEach((agent) => {
      const key = normalizeText(agent.category);

      if (!key) return;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, formatCategoryLabel(agent.category));
      }
    });

    return [
      'Todos',
      ...Array.from(categoryMap.values()).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return [...agents]
      .sort((agentA, agentB) => {
        if (agentA.featured !== agentB.featured) {
          return agentA.featured ? -1 : 1;
        }

        return (
          new Date(agentB.created_at || '').getTime() -
          new Date(agentA.created_at || '').getTime()
        );
      })
      .filter((agent) => {
        const categoryLabel = formatCategoryLabel(agent.category);

        const matchesSearch =
          normalizedSearch === '' ||
          normalizeText(agent.title).includes(normalizedSearch) ||
          normalizeText(agent.description).includes(normalizedSearch) ||
          normalizeText(categoryLabel).includes(normalizedSearch);

        const matchesCategory =
          selectedCategory === 'Todos' ||
          categoryLabel === selectedCategory;

        const matchesFeatured = !featuredOnly || agent.featured;

        return matchesSearch && matchesCategory && matchesFeatured;
      });
  }, [agents, search, selectedCategory, featuredOnly]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'Todos' ||
    featuredOnly;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('Todos');
    setFeaturedOnly(false);
  };

  const copyPrompt = async (prompt: string) => {
    if (!prompt.trim()) return;

    await navigator.clipboard.writeText(prompt);
    showSuccessMessage('Prompt copiado com sucesso.');
  };

  const openPrompt = (agent: Agent) => {
    setSelectedPrompt(agent.prompt);
    setSelectedPromptTitle(agent.title);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

          <h2 className="text-xl font-black text-slate-900">
            Carregando agentes...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparando a biblioteca premium para você.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      {successMessage && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          <Sparkles size={16} />
          Biblioteca Premium
        </div>

        <h1 className="text-4xl font-black text-slate-900">
          Agentes IA
        </h1>

        <p className="mt-3 max-w-3xl text-lg text-slate-500">
          Biblioteca premium de agentes, prompts e automações para acelerar sua criação de conteúdo.
        </p>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Buscar por agente, descrição ou categoria"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <button
            onClick={() => setFeaturedOnly((current) => !current)}
            className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-5 font-semibold transition ${featuredOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
          >
            <Star className="h-4 w-4" />
            Destaques
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            <Filter className="h-4 w-4" />
            {filteredAgents.length} de {agents.length} agentes
          </span>

          {featuredOnly && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              Exibindo destaques
            </span>
          )}

          {selectedCategory !== 'Todos' && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              {selectedCategory}
            </span>
          )}
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bot className="mx-auto mb-5 text-slate-400" size={54} />

          <h2 className="mb-3 text-2xl font-bold text-slate-700">
            Nenhum agente encontrado
          </h2>

          <p className="text-slate-500">
            Ajuste a busca ou os filtros para encontrar outros agentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ y: -4 }}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                {agent.image ? (
                  <img
                    src={agent.image}
                    alt={agent.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-950">
                    <div className="flex flex-col items-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
                        <Bot size={42} className="text-white" />
                      </div>

                      <p className="mt-4 text-sm font-medium text-white/70">
                        Agente Premium
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
                    {formatCategoryLabel(agent.category)}
                  </span>
                </div>

                {agent.featured && (
                  <div className="absolute right-4 top-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow">
                      <Star className="h-3 w-3" />
                      PREMIUM
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="mb-3 text-2xl font-black text-slate-900">
                  {agent.title}
                </h2>

                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-500">
                  {agent.description || 'Sem descrição disponível.'}
                </p>

                <div className="mt-auto grid gap-3">
                  {agent.agent_link && (
                    <a
                      href={agent.agent_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition-all hover:bg-blue-700"
                    >
                      <ExternalLink size={18} />
                      Abrir Agente
                    </a>
                  )}

                  {agent.prompt && (
                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <button
                        onClick={() => copyPrompt(agent.prompt)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-100"
                        title="Copiar prompt"
                      >
                        <Copy size={18} />
                      </button>

                      <button
                        onClick={() => openPrompt(agent)}
                        className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                      >
                        Ver Prompt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Prompt do Agente
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedPromptTitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedPrompt(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
                {selectedPrompt}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => copyPrompt(selectedPrompt)}
                  className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700"
                >
                  <Copy size={18} />
                  Copiar Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;