import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ExternalLink,
  Copy,
  Search,
  Sparkles,
  X,
  Check,
  Star,
  Filter,
} from 'lucide-react';
import { motion } from 'motion/react';
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

const normalizeText = (value?: string) => value?.trim().toLowerCase() || '';

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

const AgentImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950">
        <Bot size={24} className="text-white sm:h-10 sm:w-10" />
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

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
      setLoadError('');

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setLoadError('Não foi possível carregar os agentes agora.');
        return;
      }

      setAgents(data || []);
    } catch (err) {
      console.error(err);
      setLoadError('Não foi possível carregar os agentes agora.');
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
          selectedCategory === 'Todos' || categoryLabel === selectedCategory;

        const matchesFeatured = !featuredOnly || agent.featured;

        return matchesSearch && matchesCategory && matchesFeatured;
      });
  }, [agents, search, selectedCategory, featuredOnly]);

  const hasActiveFilters =
    search.trim() !== '' || selectedCategory !== 'Todos' || featuredOnly;

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
      <div className="space-y-4 pb-20">
        <div className="h-40 animate-pulse rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="h-28 animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[18px] border border-slate-200 bg-white sm:rounded-3xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center p-3">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <Bot className="mx-auto mb-4 h-10 w-10 text-red-500" />

          <h2 className="text-lg font-black text-slate-900">
            Biblioteca indisponível
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {loadError}
          </p>

          <button
            onClick={fetchAgents}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {successMessage && (
        <div className="fixed left-3 right-3 top-4 z-50 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:text-sm">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="mb-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mb-8 sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700 sm:text-sm">
          <Sparkles size={14} />
          Biblioteca Premium
        </div>

        <h1 className="text-3xl font-black leading-none text-slate-900 sm:text-4xl">
          Agentes IA
        </h1>

        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500 sm:mt-3 sm:text-lg">
          Biblioteca premium de agentes, prompts e automações para acelerar sua criação de conteúdo.
        </p>
      </div>

      <div className="mb-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:mb-8 sm:p-5">
        <div className="grid grid-cols-1 gap-2 sm:gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />

            <input
              type="text"
              placeholder="Buscar agentes..."
              value={search}
              aria-label="Buscar agentes"
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-14 sm:pl-12"
            />
          </div>

          <select
            value={selectedCategory}
            aria-label="Filtrar por categoria"
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-14 sm:px-5"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 xl:flex">
            <button
              onClick={() => setFeaturedOnly((current) => !current)}
              aria-pressed={featuredOnly}
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black transition sm:h-14 sm:px-5 sm:text-sm ${featuredOnly
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
            >
              <Star className="h-3.5 w-3.5" />
              Destaques
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-200 sm:h-14 sm:px-5 sm:text-sm"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-500 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
            <Filter className="h-3.5 w-3.5" />
            {filteredAgents.length} de {agents.length}
          </span>

          {featuredOnly && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              Destaques
            </span>
          )}

          {selectedCategory !== 'Todos' && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              {selectedCategory}
            </span>
          )}

          <button
            onClick={fetchAgents}
            className="rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200"
            type="button"
          >
            Atualizar biblioteca
          </button>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Bot className="mx-auto mb-4 text-slate-400" size={42} />

          <h2 className="mb-2 text-xl font-black text-slate-700">
            Nenhum agente encontrado
          </h2>

          <p className="text-sm text-slate-500">
            Ajuste a busca ou os filtros para encontrar outros agentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl sm:rounded-3xl"
            >
              <div className="relative h-24 overflow-hidden bg-slate-100 sm:aspect-video sm:h-auto">
                <AgentImage src={agent.image} alt={agent.title} />

                <div className="absolute left-1.5 top-1.5 sm:left-4 sm:top-4">
                  <span className="line-clamp-1 max-w-[72px] rounded-full bg-white/90 px-1.5 py-0.5 text-[7px] font-black uppercase text-slate-800 shadow-sm backdrop-blur sm:max-w-none sm:px-3 sm:py-1 sm:text-xs">
                    {formatCategoryLabel(agent.category)}
                  </span>
                </div>

                {agent.featured && (
                  <div className="absolute right-1.5 top-1.5 sm:right-4 sm:top-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[7px] font-black text-amber-950 shadow sm:px-3 sm:py-1 sm:text-xs">
                      <Star className="hidden h-3 w-3 sm:block" />
                      PRO
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-2 sm:p-6">
                <h2 className="line-clamp-2 text-[11px] font-black leading-tight text-slate-900 sm:mb-3 sm:text-2xl">
                  {agent.title}
                </h2>

                <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-500 sm:mb-6 sm:line-clamp-3 sm:text-sm">
                  {agent.description || 'Sem descrição disponível.'}
                </p>

                <div className="mt-auto grid gap-1.5 pt-2 sm:gap-3 sm:pt-0">
                  {agent.agent_link && (
                    <a
                      href={agent.agent_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ferramenta externa ${agent.title}`}
                      className="flex h-8 items-center justify-center gap-1 rounded-xl bg-blue-600 text-[9px] font-black text-white transition-all hover:bg-blue-700 sm:h-12 sm:gap-2 sm:rounded-2xl sm:text-base"
                    >
                      <ExternalLink size={11} className="sm:h-[18px] sm:w-[18px]" />
                      <span className="sm:hidden">Abrir</span>
                      <span className="hidden sm:inline">Abrir ferramenta</span>
                    </a>
                  )}

                  {agent.prompt && (
                    <div className="grid grid-cols-[28px_1fr] gap-1.5 sm:grid-cols-[auto_1fr] sm:gap-3">
                      <button
                        onClick={() => copyPrompt(agent.prompt)}
                        className="flex h-8 w-7 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 sm:h-12 sm:w-12 sm:rounded-2xl"
                        title="Copiar prompt"
                        aria-label={`Copiar prompt de ${agent.title}`}
                      >
                        <Copy size={12} className="sm:h-[18px] sm:w-[18px]" />
                      </button>

                      <button
                        onClick={() => openPrompt(agent)}
                        aria-label={`Ver prompt de ${agent.title}`}
                        className="h-8 rounded-xl border border-slate-200 px-1 text-[9px] font-black text-slate-700 transition-all hover:bg-slate-100 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                      >
                        Prompt
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Prompt do Agente
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  {selectedPromptTitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedPrompt(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100"
                aria-label="Fechar prompt"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 sm:p-5">
                {selectedPrompt}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => copyPrompt(selectedPrompt)}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 sm:h-12 sm:px-6"
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
