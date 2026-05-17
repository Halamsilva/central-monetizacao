import React, { useEffect, useMemo, useState } from 'react';
import { Bot, ExternalLink, Copy, Search } from 'lucide-react';
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

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('featured', { ascending: false })
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
    const uniqueCategories = agents
      .map((agent) => agent.category)
      .filter(Boolean);

    return ['Todos', ...Array.from(new Set(uniqueCategories))];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const searchText = `${agent.title} ${agent.description} ${agent.category}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todos' || agent.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [agents, search, selectedCategory]);

  const copyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    alert('Prompt copiado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Carregando agentes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Agentes IA
        </h1>

        <p className="text-slate-500 mt-2">
          Biblioteca premium de agentes, prompts e ferramentas de monetização.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Buscar agente por nome, categoria ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
          <Bot className="mx-auto mb-4 text-slate-400" size={48} />

          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Nenhum agente encontrado
          </h2>

          <p className="text-slate-500">
            Adicione agentes no painel admin para aparecer aqui.
          </p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
          <Bot className="mx-auto mb-4 text-slate-400" size={48} />

          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Nenhum resultado encontrado
          </h2>

          <p className="text-slate-500">
            Tente outra busca ou selecione outra categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
            >
              {agent.image && (
                <img
                  src={agent.image}
                  alt={agent.title}
                  className="w-full h-52 object-cover"
                />
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {agent.category}
                  </span>

                  {agent.featured && (
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                      Destaque
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {agent.title}
                </h2>

                <p className="text-slate-500 text-sm mb-5 line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex gap-3">
                  {agent.agent_link && (
                    <a
                      href={agent.agent_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-medium transition-all"
                    >
                      <ExternalLink size={18} />
                      Abrir
                    </a>
                  )}

                  {agent.prompt && (
                    <button
                      onClick={() => copyPrompt(agent.prompt)}
                      className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 rounded-xl px-4 py-3 transition-all"
                    >
                      <Copy size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Agents;