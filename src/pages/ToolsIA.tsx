import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Loader2, Wrench, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ToolItem {
  id: string;
  title: string;
  external_link: string;
  image: string;
  created_at: string;
}

const ToolsIAPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // MODIFICAÇÃO 1: O formulário agora inicia buscando o rascunho salvo no navegador (se houver)
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem('tools_form_draft');
    return savedDraft ? JSON.parse(savedDraft) : { title: '', external_link: '', image: '' };
  });

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  // MODIFICAÇÃO 2: A cada letra que você digita, o rascunho é salvo no armazenamento local
  useEffect(() => {
    localStorage.setItem('tools_form_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tools_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (err) {
      console.error('Erro ao carregar ferramentas:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: 'title' | 'external_link' | 'image', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const saveItem = async () => {
    if (!formData.title.trim() || !formData.external_link.trim() || !formData.image.trim()) {
      setMessage({ type: 'error', text: 'Preencha todos os campos antes de adicionar.' });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('tools_items')
        .insert([
          {
            title: formData.title.trim(),
            external_link: formData.external_link.trim(),
            image: formData.image.trim(),
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Ferramenta adicionada com sucesso para os alunos!' });

      // MODIFICAÇÃO 3: Limpa o formulário e destrói o rascunho antigo após salvar com sucesso
      const emptyForm = { title: '', external_link: '', image: '' };
      setFormData(emptyForm);
      localStorage.removeItem('tools_form_draft');

      await loadTools();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao salvar a ferramenta.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Deseja mesmo excluir esta ferramenta?')) return;

    try {
      const { error } = await supabase
        .from('tools_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Ferramenta removida.' });
      await loadTools();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao deletar.' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4">
      {/* Banner Superior Roxo */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-10 text-white shadow-xl shadow-purple-100"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Wrench size={28} />
          </div>
          <h1 className="text-4xl font-black">Ferramentas IA</h1>
          <p className="mt-3 text-xl font-bold text-white/95">Otimize seu fluxo de trabalho</p>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80">
            Descubra e aprende a usar as melhores IAs do mercado para edição de vídeo, criação de imagens, vozes neurais e automação completa.
          </p>
        </div>
        <Wrench className="absolute -right-10 bottom-0 h-56 w-56 text-white/10" />
      </motion.div>

      {/* Alerta de Mensagem */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-white ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {/* FORMULÁRIO DE ADMINISTRAÇÃO COM RASCUNHO PROTEGIDO */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[28px] border border-purple-200 bg-purple-50/50 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Plus size={22} className="text-purple-600" />
            <h2 className="text-xl font-black text-slate-900">Adicionar Nova Ferramenta para os Alunos</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">Título da Ferramenta</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Ex: Midjourney, ElevenLabs"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">Link de Acesso</label>
              <input
                type="text"
                value={formData.external_link}
                onChange={e => updateField('external_link', e.target.value)}
                placeholder="https://..."
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">URL da Imagem do Card</label>
              <input
                type="text"
                value={formData.image}
                onChange={e => updateField('image', e.target.value)}
                placeholder="https://linkdaimagem.com/foto.jpg"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={saveItem}
            disabled={saving}
            className="flex w-full h-12 items-center justify-center gap-2 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition disabled:opacity-50 shadow-md shadow-purple-100"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {saving ? 'Adicionando...' : 'Liberar Ferramenta na Plataforma'}
          </button>
        </motion.div>
      )}

      {/* Grid de Ferramentas */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-purple-600" size={20} />
            Carregando ferramentas...
          </div>
        </div>
      ) : tools.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-xl font-black text-slate-900">Nenhuma ferramenta cadastrada ainda</h3>
          <p className="mt-2 text-sm text-slate-500">Use o formulário acima para adicionar as primeiras!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm hover:-translate-y-1 transition hover:shadow-lg"
            >
              {isAdmin && (
                <button
                  onClick={() => deleteItem(tool.id)}
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition"
                  title="Excluir ferramenta"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img src={tool.image} alt={tool.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-black leading-tight text-slate-900 line-clamp-2 mb-4">
                  {tool.title}
                </h3>
                <div className="mt-auto">
                  <a
                    href={tool.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 text-xs font-black text-white hover:bg-purple-700 transition shadow-md shadow-purple-100"
                  >
                    <ExternalLink size={14} />
                    Acessar Ferramenta
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsIAPage;
