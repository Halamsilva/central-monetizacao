import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Bot, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Star, 
  Check, 
  ShieldAlert,
  UserCheck,
  UserX,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { MOCK_NOTICES, MOCK_AGENTS } from '../lib/mockData';
import { Notice, Agent } from '../lib/supabase';
import { cn } from '../lib/utils';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'agents' | 'users'>('notices');
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  
  // Notice Form State
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  // Agent Form State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Partial<Agent> | null>(null);

  const handleDeleteNotice = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for save/add
    setIsNoticeModalOpen(false);
    setEditingNotice(null);
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Administrativo</h2>
          <p className="text-gray-500">Gerencie o conteúdo e os usuários da plataforma.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('notices')}
          className={cn(
            "px-6 py-4 text-sm font-bold border-b-2 transition-all",
            activeTab === 'notices' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center gap-2"><Bell size={18} /> Avisos</div>
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={cn(
            "px-6 py-4 text-sm font-bold border-b-2 transition-all",
            activeTab === 'agents' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center gap-2"><Bot size={18} /> Agentes IA</div>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-4 text-sm font-bold border-b-2 transition-all",
            activeTab === 'users' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center gap-2"><Users size={18} /> Alunos</div>
        </button>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingNotice({}); setIsNoticeModalOpen(true); }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
              >
                <Plus size={18} /> Novo Aviso
              </button>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm font-sans mb-10">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fixado</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{notice.title}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          notice.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {notice.is_published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {notice.is_pinned && <Star size={16} className="text-amber-500 fill-amber-500" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 text-primary font-bold">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                          <button 
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingAgent({}); setIsAgentModalOpen(true); }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
              >
                <Plus size={18} /> Novo Agente
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{agent.title}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{agent.category} • {agent.tag}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                      <Edit size={18} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Alunos Cadastrados</h3>
              <div className="text-sm font-semibold text-gray-400">Total: 124 Alunos</div>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm font-sans mb-10">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Acesso</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">Aluno {i} Exemplo</td>
                      <td className="px-6 py-4 text-sm text-gray-600">aluno{i}@email.com</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">Ativo</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Ver Detalhes"><Save size={18} /></button>
                          <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Bloquear"><UserX size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Notice Editor Modal (Example) */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsNoticeModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Criar Novo Aviso</h3>
            <form onSubmit={handleSaveNotice} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Título</label>
                <input type="text" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-blue-500 focus:bg-white" placeholder="Título chamativo" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Conteúdo</label>
                <textarea className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:border-blue-500 focus:bg-white min-h-[150px]" placeholder="Escreva os detalhes..." />
              </div>
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                   <span className="text-sm font-bold text-gray-700">Fixar no Topo</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                   <span className="text-sm font-bold text-gray-700">Publicar Imediatamente</span>
                 </label>
              </div>
              <div className="pt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="rounded-xl px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-8 py-2.5 font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700">Salvar Aviso</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
