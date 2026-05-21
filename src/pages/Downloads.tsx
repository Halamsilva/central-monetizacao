import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4 sm:space-y-8">
      {/* Título da Página */}
      <div className="px-1">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Biblioteca de Downloads</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Materiais de apoio, checklists e templates exclusivos para alunos.</p>
      </div>

      {/* Mensagens de feedback */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-white text-sm sm:text-base ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {/* PAINEL DE ADMINISTRAÇÃO */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[20px] sm:rounded-[28px] border border-blue-200 bg-blue-50/30 p-4 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Adicionar Novo Material</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500">Título do Material</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Ex: Template de Roteiro VSL"
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500">Tipo de Arquivo</label>
              <select
                value={formData.type}
                onChange={e => updateField('type', e.target.value)}
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              >
                {itemTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500">Link do Arquivo</label>
              <input
                type="text"
                value={formData.external_link}
                onChange={e => updateField('external_link', e.target.value)}
                placeholder="https://..."
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500">Descrição Curta</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="O passo a passo definitivo para não esquecer nada..."
              className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={saveItem}
            disabled={saving}
            className="flex w-full h-11 sm:h-12 items-center justify-center gap-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-100 text-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {saving ? 'Publicando...' : 'Liberar Material na Biblioteca'}
          </button>
        </motion.div>
      )}

      {/* GRID CORRIGIDO EM 3 COLUNAS PARA MOBILE */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Carregando arquivos de apoio...
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-[20px] sm:rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Download size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Nenhum material cadastrado</h3>
          <p className="mt-1 text-xs text-slate-500">Novos materiais estarão disponíveis em breve.</p>
        </div>
      ) : (
        /* O segredo: grid-cols-3 puro sem interferência de quebras erradas */
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((item, index) => {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group relative flex flex-col overflow-hidden rounded-[12px] sm:rounded-[24px] border border-slate-200 bg-white shadow-sm hover:-translate-y-1 transition hover:shadow-lg"
              >
                {/* Lixeira Admin flutuante redonda idêntica aos agentes */}
                {isAdmin && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute right-1 top-1 sm:right-2 sm:top-2 z-20 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm hover:bg-rose-600 transition"
                  >
                    <Trash2 size={10} className="sm:size-3.5" />
                  </button>
                )}

                {/* Ícone no topo igual à imagem dos cards de agentes */}
                <div className="relative h-16 xs:h-20 sm:h-36 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 border-b border-slate-100">
                  {item.type === 'Planilha' ? (
                    <FileSpreadsheet size={24} className="text-blue-500 sm:size-12" />
                  ) : (
                    <FileText size={24} className="text-blue-500 sm:size-12" />
                  )}

                  {/* Tag Superior do Tipo */}
                  <span className="absolute left-1 top-1 rounded bg-slate-100 px-1 py-0.5 text-[7px] sm:text-[10px] font-black uppercase text-slate-600 tracking-tight shadow-2xs max-w-[calc(100%-8px)] truncate">
                    {item.type}
                  </span>
                </div>

                {/* Textos e Botão Base */}
                <div className="flex flex-1 flex-col p-1.5 sm:p-4">
                  <h3 className="text-[10px] sm:text-base font-black leading-tight text-slate-900 line-clamp-2 min-h-[24px] sm:min-h-[44px]">
                    {item.title}
                  </h3>

                  {/* Esconde a descrição no mobile para não esmagar as 3 colunas */}
                  <p className="mt-1 hidden sm:line-clamp-2 text-xs font-medium text-slate-500 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-1.5">
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 sm:h-10 items-center justify-center gap-1 rounded-md sm:rounded-xl bg-blue-600 text-[9px] sm:text-xs font-black text-white hover:bg-blue-700 transition shadow-xs"
                    >
                      <Download size={10} className="sm:size-3.5" />
                      <span>Baixar</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
