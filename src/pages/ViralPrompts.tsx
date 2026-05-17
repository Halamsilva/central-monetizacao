import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Plus,
  Copy,
  Search,
  Star,
  Trash2,
  Pencil,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ViralPrompt {
  id: string;
  title: string;
  category: string;
  content: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

const emptyForm = {
  title: '',
  category: 'Prompts Virais',
  content: '',
  is_featured: false,
  is_published: true,
};

const ViralPrompts: React.FC = () => {
  const { isAdmin } = useAuth();

  const [prompts, setPrompts] = useState<ViralPrompt[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadPrompts();
  }, [isAdmin]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const loadPrompts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('viral_prompts')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setMessage({
          type: 'error',
          text: 'Erro ao carregar prompts virais.',
        });
        return;
      }

      setPrompts(data || []);
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao carregar prompts.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return prompts;

    return prompts.filter((prompt) => {
      return (
        prompt.title.toLowerCase().includes(term) ||
        prompt.category.toLowerCase().includes(term) ||
        prompt.content.toLowerCase().includes(term)
      );
    });
  }, [prompts, search]);

  const updateField = (
    field: keyof typeof emptyForm,
    value: string | boolean
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const savePrompt = async () => {
    if (!formData.title.trim()) {
      setMessage({
        type: 'error',
        text: 'Digite um título para o prompt.',
      });
      return;
    }

    if (!formData.content.trim()) {
      setMessage({
        type: 'error',
        text: 'Digite o conteúdo do prompt.',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        const { error } = await supabase
          .from('viral_prompts')
          .update({
            title: formData.title.trim(),
            category: formData.category.trim() || 'Prompts Virais',
            content: formData.content.trim(),
            is_featured: formData.is_featured,
            is_published: formData.is_published,
          })
          .eq('id', editingId);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Prompt atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase.from('viral_prompts').insert([
          {
            title: formData.title.trim(),
            category: formData.category.trim() || 'Prompts Virais',
            content: formData.content.trim(),
            is_featured: formData.is_featured,
            is_published: formData.is_published,
          },
        ]);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Prompt criado com sucesso.',
        });
      }

      resetForm();
      await loadPrompts();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar prompt. Verifique as permissões no Supabase.',
      });
    } finally {
      setSaving(false);
    }
  };

  const editPrompt = (prompt: ViralPrompt) => {
    setEditingId(prompt.id);

    setFormData({
      title: prompt.title || '',
      category: prompt.category || 'Prompts Virais',
      content: prompt.content || '',
      is_featured: prompt.is_featured || false,
      is_published: prompt.is_published ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deletePrompt = async (prompt: ViralPrompt) => {
    const confirmDelete = confirm(
      `Tem certeza que deseja excluir "${prompt.title}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(prompt.id);

      const { error } = await supabase
        .from('viral_prompts')
        .delete()
        .eq('id', prompt.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Prompt excluído com sucesso.',
      });

      await loadPrompts();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro ao excluir prompt.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const copyPrompt = async (prompt: ViralPrompt) => {
    await navigator.clipboard.writeText(prompt.content);

    setCopiedId(prompt.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-500 to-orange-700 p-10 text-white shadow-xl shadow-orange-200"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Zap size={28} />
          </div>

          <h1 className="text-4xl font-black">Prompts Virais</h1>

          <p className="mt-3 text-xl font-bold text-white/95">
            O segredo da retenção e do engajamento
          </p>

          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/90">
            Uma coleção curada de ganchos, ideias e estruturas de roteiros para
            acelerar sua criação de conteúdo.
          </p>
        </div>

        <Zap className="absolute -right-10 bottom-0 h-56 w-56 text-white/10" />
      </motion.div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-700'
            }`}
        >
          {message.type === 'success' ? (
            <Check size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}

          {message.text}
        </div>
      )}

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {editingId ? 'Editar Prompt Viral' : 'Novo Prompt Viral'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Cadastre prompts que os alunos poderão copiar na plataforma.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Título do prompt"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <input
              type="text"
              value={formData.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="Categoria"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <textarea
            value={formData.content}
            onChange={(event) => updateField('content', event.target.value)}
            placeholder="Cole aqui o prompt completo..."
            className="mt-4 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-relaxed outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(event) =>
                    updateField('is_featured', event.target.checked)
                  }
                />
                Destaque
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(event) =>
                    updateField('is_published', event.target.checked)
                  }
                />
                Publicado para alunos
              </label>
            </div>

            <button
              type="button"
              onClick={savePrompt}
              disabled={saving}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {editingId ? 'Salvar Alterações' : 'Adicionar Prompt'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Biblioteca de Prompts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? 'Gerencie os prompts virais disponíveis para os alunos.'
                : 'Copie os prompts e use nas suas criações.'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            {filteredPrompts.length} disponíveis
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, categoria ou conteúdo"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-[28px] border border-slate-200 bg-white p-12 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Carregando prompts virais...
          </div>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
            <Zap size={30} />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Nenhum prompt encontrado
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? 'Cadastre o primeiro prompt viral no formulário acima.'
              : 'Novos prompts aparecerão aqui em breve.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                  {prompt.category}
                </span>

                {prompt.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    <Star size={13} />
                    Destaque
                  </span>
                )}

                {isAdmin && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${prompt.is_published
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {prompt.is_published ? (
                      <Eye size={13} />
                    ) : (
                      <EyeOff size={13} />
                    )}
                    {prompt.is_published ? 'Publicado' : 'Oculto'}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-900">
                {prompt.title}
              </h3>

              <div className="mt-4 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="line-clamp-6 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">
                  {prompt.content}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => copyPrompt(prompt)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  {copiedId === prompt.id ? (
                    <>
                      <Check size={18} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copiar Prompt
                    </>
                  )}
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => editPrompt(prompt)}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 text-sm font-black text-white transition hover:bg-amber-600"
                    >
                      <Pencil size={18} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePrompt(prompt)}
                      disabled={deletingId === prompt.id}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-70"
                    >
                      {deletingId === prompt.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViralPrompts;