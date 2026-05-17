import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
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
  ExternalLink,
  PackageSearch,
  Video,
  FileText,
  ListChecks,
  Target,
  Link as LinkIcon,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface TikTokShopItem {
  id: string;
  title: string;
  type: string;
  intent: string;
  description: string;
  content: string;
  external_link?: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

const itemTypes = [
  'Estratégia',
  'Prompt',
  'Roteiro',
  'Checklist',
  'Agente',
  'Produto vencedor',
  'Link',
];

const itemIntents = [
  'Encontrar produto',
  'Criar vídeo',
  'Escrever gancho',
  'Fazer oferta',
  'Converter venda',
  'Analisar concorrente',
];

const emptyForm = {
  title: '',
  type: 'Estratégia',
  intent: 'Criar vídeo',
  description: '',
  content: '',
  external_link: '',
  is_featured: false,
  is_published: true,
};

const TikTokShop: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<TikTokShopItem[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedIntent, setSelectedIntent] = useState('Todas');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadItems();
  }, [isAdmin]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const loadItems = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('tiktok_shop_items')
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
          text: 'Erro ao carregar conteúdos de TikTok Shop.',
        });
        return;
      }

      setItems(data || []);
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao carregar conteúdos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.intent.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);

      const matchesType =
        selectedType === 'Todos' || item.type === selectedType;

      const matchesIntent =
        selectedIntent === 'Todas' || item.intent === selectedIntent;

      return matchesSearch && matchesType && matchesIntent;
    });
  }, [items, search, selectedType, selectedIntent]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      featured: items.filter((item) => item.is_featured).length,
      prompts: items.filter(
        (item) => item.type === 'Prompt' || item.type === 'Roteiro'
      ).length,
      links: items.filter((item) => item.external_link).length,
    };
  }, [items]);

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

  const saveItem = async () => {
    if (!formData.title.trim()) {
      setMessage({
        type: 'error',
        text: 'Digite um título para o conteúdo.',
      });
      return;
    }

    if (!formData.description.trim()) {
      setMessage({
        type: 'error',
        text: 'Digite uma descrição curta.',
      });
      return;
    }

    if (!formData.content.trim() && !formData.external_link.trim()) {
      setMessage({
        type: 'error',
        text: 'Adicione um conteúdo ou um link.',
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        intent: formData.intent,
        description: formData.description.trim(),
        content: formData.content.trim(),
        external_link: formData.external_link.trim() || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
      };

      if (editingId) {
        const { error } = await supabase
          .from('tiktok_shop_items')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Conteúdo atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('tiktok_shop_items')
          .insert([payload]);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Conteúdo criado com sucesso.',
        });
      }

      resetForm();
      await loadItems();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar conteúdo. Verifique as permissões no Supabase.',
      });
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: TikTokShopItem) => {
    setEditingId(item.id);

    setFormData({
      title: item.title || '',
      type: item.type || 'Estratégia',
      intent: item.intent || 'Criar vídeo',
      description: item.description || '',
      content: item.content || '',
      external_link: item.external_link || '',
      is_featured: item.is_featured || false,
      is_published: item.is_published ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteItem = async (item: TikTokShopItem) => {
    const confirmDelete = confirm(
      `Tem certeza que deseja excluir "${item.title}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(item.id);

      const { error } = await supabase
        .from('tiktok_shop_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Conteúdo excluído com sucesso.',
      });

      await loadItems();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Erro ao excluir conteúdo.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const copyContent = async (item: TikTokShopItem) => {
    await navigator.clipboard.writeText(item.content);

    setCopiedId(item.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Prompt') return FileText;
    if (type === 'Roteiro') return Video;
    if (type === 'Checklist') return ListChecks;
    if (type === 'Agente') return Target;
    if (type === 'Produto vencedor') return PackageSearch;
    if (type === 'Link') return LinkIcon;

    return ShoppingBag;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-10 text-white shadow-xl shadow-slate-300"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShoppingBag size={28} />
          </div>

          <h1 className="text-4xl font-black">TikTok Shop</h1>

          <p className="mt-3 text-xl font-bold text-white/95">
            Domine as vendas no ecossistema do TikTok
          </p>

          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80">
            Estratégias, prompts, roteiros, checklists e agentes para encontrar
            produtos, criar vídeos e vender todos os dias.
          </p>
        </div>

        <ShoppingBag className="absolute -right-10 bottom-0 h-56 w-56 text-white/10" />
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
                {editingId
                  ? 'Editar Conteúdo TikTok Shop'
                  : 'Novo Conteúdo TikTok Shop'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Cadastre materiais que os alunos poderão acessar na aba TikTok
                Shop.
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
              placeholder="Título"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <select
              value={formData.type}
              onChange={(event) => updateField('type', event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            >
              {itemTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <select
              value={formData.intent}
              onChange={(event) => updateField('intent', event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            >
              {itemIntents.map((intent) => (
                <option key={intent}>{intent}</option>
              ))}
            </select>

            <input
              type="text"
              value={formData.external_link}
              onChange={(event) =>
                updateField('external_link', event.target.value)
              }
              placeholder="Link opcional"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <input
            type="text"
            value={formData.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            placeholder="Descrição curta"
            className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <textarea
            value={formData.content}
            onChange={(event) => updateField('content', event.target.value)}
            placeholder="Conteúdo completo, prompt, roteiro, checklist ou estratégia..."
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
              onClick={saveItem}
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
                  {editingId ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Destaques
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {stats.featured}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Prompts e Roteiros
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {stats.prompts}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Links
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {stats.links}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Biblioteca TikTok Shop
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? 'Gerencie conteúdos, agentes e estratégias para TikTok Shop.'
                : 'Acesse conteúdos prontos para vender mais no TikTok Shop.'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            {filteredItems.length} disponíveis
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_240px]">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, descrição ou conteúdo"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option>Todos</option>
            {itemTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            value={selectedIntent}
            onChange={(event) => setSelectedIntent(event.target.value)}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option>Todas</option>
            {itemIntents.map((intent) => (
              <option key={intent}>{intent}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-[28px] border border-slate-200 bg-white p-12 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Carregando conteúdos de TikTok Shop...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
            <ShoppingBag size={30} />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Nenhum conteúdo encontrado
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? 'Cadastre o primeiro conteúdo de TikTok Shop no formulário acima.'
              : 'Novos conteúdos aparecerão aqui em breve.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => {
            const TypeIcon = getTypeIcon(item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <TypeIcon size={22} />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {item.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        <Star size={13} />
                        Destaque
                      </span>
                    )}

                    {isAdmin && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${item.is_published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {item.is_published ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                        {item.is_published ? 'Publicado' : 'Oculto'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                    {item.type}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {item.intent}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  {item.description}
                </p>

                {item.content && (
                  <div className="mt-4 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="line-clamp-5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">
                      {item.content}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3">
                  {item.content && (
                    <button
                      type="button"
                      onClick={() => copyContent(item)}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check size={18} />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copiar Conteúdo
                        </>
                      )}
                    </button>
                  )}

                  {item.external_link && (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      <ExternalLink size={18} />
                      Abrir Link
                    </a>
                  )}

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => editItem(item)}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-black text-white transition hover:bg-amber-600"
                      >
                        <Pencil size={17} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        disabled={deletingId === item.id}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-70"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="animate-spin" size={17} />
                        ) : (
                          <Trash2 size={17} />
                        )}
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TikTokShop;