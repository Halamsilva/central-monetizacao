import React, { useEffect, useState } from 'react';
import { Bot, ExternalLink, Copy } from 'lucide-react';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Agentes IA
        </h1>

        <p className="text-slate-500 mt-2">
          Biblioteca de agentes e prompts premium
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
          <Bot className="mx-auto mb-4 text-slate-400" size={48} />

          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Nenhum agente encontrado
          </h2>

          <p className="text-slate-500">
            Adicione agentes no Supabase para aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
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