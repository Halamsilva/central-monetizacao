import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ExternalLink,
  Copy,
  Search,
  Sparkles,
  X
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
}

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
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
    const unique = [...new Set(agents.map((a) => a.category))];
    return ['Todos', ...unique];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.title.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Todos' ||
        agent.category === selectedCategory;

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Sparkles size={16} />
          Biblioteca Premium
        </div>

        <h1 className="text-4xl font-black text-slate-900">
          Agentes IA
        </h1>

        <p className="text-slate-500 mt-3 text-lg">
          Biblioteca premium de agentes, prompts e automações virais.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Buscar agentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 outline-none"
          >
            {categories.map((category) => (
              <option key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
          <Bot className="mx-auto mb-5 text-slate-400" size={54} />

          <h2 className="text-2xl font-bold text-slate-700 mb-3">
            Nenhum agente encontrado
          </h2>

          <p className="text-slate-500">
            Tente outro termo ou categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {filteredAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-slate-100">
                {agent.image ? (
                  <img
                    src={agent.image}
                    alt={agent.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot size={48} className="text-slate-300" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-800">
                    {agent.category}
                  </span>
                </div>

                {agent.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold shadow">
                      PREMIUM
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  {agent.title}
                </h2>

                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex gap-3">
                  {agent.agent_link && (
                    <a
                      href={agent.agent_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink size={18} />
                      Abrir
                    </a>
                  )}

                  {agent.prompt && (
                    <>
                      <button
                        onClick={() => copyPrompt(agent.prompt)}
                        className="h-12 w-12 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all"
                      >
                        <Copy size={18} />
                      </button>

                      <button
                        onClick={() => setSelectedPrompt(agent.prompt)}
                        className="h-12 px-4 rounded-2xl border border-slate-200 hover:bg-slate-100 text-sm font-medium transition-all"
                      >
                        Ver Prompt
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Prompt */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900">
                Prompt do Agente
              </h3>

              <button
                onClick={() => setSelectedPrompt(null)}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                {selectedPrompt}
              </div>

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => copyPrompt(selectedPrompt)}
                  className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
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