import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, Plus, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  type: string;
  external_link: string;
  created_at: string;
}

const itemTypes = ['Checklist', 'Template', 'Ebook', 'Planilha', 'Outros'];

const DownloadsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [materials, setMaterials] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem('downloads_form_draft');
    return savedDraft ? JSON.parse(savedDraft) : { title: '', description: '', type: 'Checklist', external_link: '' };
  });

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    localStorage.setItem('downloads_form_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('downloads_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Erro ao carregar downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: 'title' | 'description' | 'type' | 'external_link', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const saveItem = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.external_link.trim()) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('downloads_items')
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            type: formData.type,
            external_link: formData.external_link.trim(),
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Material liberado com sucesso para os alunos!' });

      setFormData({ title: '', description: '', type: 'Checklist', external_link: '' });
      localStorage.removeItem('downloads_form_draft');

      await loadMaterials();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao salvar o material.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Deseja mesmo remover este material de download?')) return;

    try {
      const { error } = await supabase
        .from('downloads_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Material removido.' });
      await loadMaterials();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao deletar.' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4">
      {/* Título da Página */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Biblioteca de Downloads</h1>
        <p className="mt-1 text-sm text-slate-500">Materiais de apoio, checklists e templates exclusivos para alunos.</p>
      </div>

      {/* Mensagens de feedback */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-white ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {/* PAINEL DE ADMINISTRAÇÃO */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[28px] border border-blue-200 bg-blue-50/30 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Plus size={22} className="text-blue-600" />
            <h2 className="text-xl font-black text-slate-900">Adicionar Novo Material para Download</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">Título do Material</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Ex: Template de Roteiro VSL"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">Tipo de Arquivo</label>
              <select
                value={formData.type}
                onChange={e => updateField('type', e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              >
                {itemTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-slate-500">Link do Arquivo (Drive / Dropbox)</label>
              <input
                type="text"
                value={formData.external_link}
                onChange={e => updateField('external_link', e.target.value)}
                placeholder="https://..."
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-black uppercase text-slate-500">Descrição Curta</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="O passo a passo definitivo para não esquecer nada..."
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={saveItem}
            disabled={saving}
            className="flex w-full h-12 items-center justify-center gap-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-100"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {saving ? 'Publicando...' : 'Liberar Material na Biblioteca'}
          </button>
        </motion.div>
      )}

      {/* LISTAGEM DOS CARDS */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Carregando arquivos de apoio...
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Download size={26} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Nenhum material de apoio cadastrado</h3>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? 'Utilize o painel de administração acima para liberar os primeiros downloads para os seus alunos.'
              : 'Novos materiais de apoio e checklists estarão disponíveis aqui em breve.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {materials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative flex items-center gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {item.type === 'Planilha' ? <FileSpreadsheet size={26} /> : <FileText size={26} />}
              </div>

              <div className="min-w-0 flex-1 pr-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 truncate">{item.title}</h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0">
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <a
                  href={item.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  <Download size={14} />
                  Baixar Material
                </a>
              </div>

              {isAdmin && (
                <button
                  onClick={() => deleteItem(item.id)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition"
                  title="Remover material"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;