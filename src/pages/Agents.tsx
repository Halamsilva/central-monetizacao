import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  X, 
  Bot, 
  Check,
  Zap,
  Star,
  Info,
  ArrowRight
} from 'lucide-react';
import { MOCK_AGENTS } from '../lib/mockData';
import { Agent } from '../lib/supabase';
import { cn } from '../lib/utils';

const CATEGORIES = [
  'Todos',
  'TikTok Shop',
  'Facebook Monetização',
  'YouTube Shorts',
  'Reels',
  'Canal Dark',
  'IA para Conteúdo',
  'Prompts Virais',
  'Copywriting',
  'Reacts',
  'Novelinhas',
  'Imagens Virais'
];

const TagBadge: React.FC<{ tag: Agent['tag'] }> = ({ tag }) => {
  const styles = {
    'NOVO': 'bg-red-50 text-red-600',
    'ATUALIZADO': 'bg-blue-50 text-blue-600',
    'PREMIUM': 'bg-amber-50 text-amber-600',
    'EXCLUSIVO': 'bg-slate-50 text-slate-600'
  };
  
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
      styles[tag] || 'bg-slate-50 text-slate-600'
    )}>
      {tag}
    </span>
  );
};

const Agents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredAgents = MOCK_AGENTS.filter(agent => {
    const matchesSearch = agent.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Biblioteca de Agentes</h2>
          <p className="text-sm text-slate-500">Explore e utilize nossa biblioteca exclusiva de IA.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-500 transition-all sm:w-48"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-500 transition-all sm:w-48"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedAgent(agent)}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Bot size={20} />
                </div>
                <TagBadge tag={agent.tag} />
              </div>
              
              <h3 className="text-base font-bold text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                {agent.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {agent.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {agent.category}
              </span>
              <button className="text-blue-700 text-[10px] font-bold flex items-center gap-1 hover:underline">
                Abrir Agente <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhum agente encontrado</h3>
          <p className="text-sm text-slate-400">Tente buscar por outro termo ou categoria.</p>
        </div>
      )}

      {/* Agent Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedAgent.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TagBadge tag={selectedAgent.tag} />
                      <span className="text-[10px] text-slate-400">Atualizado em {new Date(selectedAgent.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={12} className="text-blue-500" /> Descrição do Agente
                  </h4>
                  <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedAgent.description}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} className="text-brand-amber" /> Prompt Otimizado
                    </h4>
                    <button 
                      onClick={() => handleCopy(selectedAgent.prompt)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all",
                        copied ? "bg-green-50 text-green-700" : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
                      )}
                    >
                      {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar Prompt</>}
                    </button>
                  </div>
                  <div className="relative">
                    <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-6 font-mono text-xs leading-relaxed text-blue-100 overflow-x-auto max-h-[300px] custom-scrollbar">
                      {selectedAgent.prompt}
                    </pre>
                  </div>
                </section>

                {selectedAgent.external_link && (
                  <a 
                    href={selectedAgent.external_link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all group bg-slate-50"
                  >
                    Acessar Recurso Externo <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button 
                  onClick={() => setSelectedAgent(null)}
                  className="rounded-xl px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Agents;
