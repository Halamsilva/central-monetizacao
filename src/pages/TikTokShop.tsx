import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Target,
  Trash2,
  Video,
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
  image?: string | null;
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
  image: '',
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
        image: formData.image.trim() || null,
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
          text: 'Conteúdo updated com sucesso.',
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
      image: item.image || '',
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
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4 sm:space-y-8">
      {/* Banner Principal */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-6 sm:p-10 text-white shadow-xl shadow-slate-300"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShoppingBag size={24} sm={28} />
          </div>

          <h1 className="text-2xl font-black sm:text-4xl">TikTok Shop</h1>

          <p className="mt-1 sm:mt-3 text-lg sm:text-xl font-bold text-white/95">
            Domine as vendas no ecossistema do TikTok
          </p>

          <p className="mt-3 sm:mt-5 max-w-2xl text-xs sm:text-base font-medium leading-relaxed text-white/80">
            Estratégias, prompts, roteiros, checklists e agentes para encontrar
            produtos, criar vídeos e vender todos os dias.
          </p>
        </div>

        <ShoppingBag className="absolute -right-10 bottom-0 h-44 w-44 sm:h-56 sm:w-56 text-white/10" />
      </motion.div>

      {/* Alerta de Mensagem */}
      {message && (
        <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${message.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Formulário Admin */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {editingId ? 'Editar Conteúdo TikTok Shop' : 'Novo Conteúdo TikTok Shop'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Cadastre materiais que os alunos poderão acessar na aba TikTok Shop.
              </p>
            </div>

            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                Cancelar edição
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" value={formData.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Título" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white" />
            <select value={formData.type} onChange={(event) => updateField('type', event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white">
              {itemTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select value={formData.intent} onChange={(event) => updateField('intent', event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white">
              {itemIntents.map((intent) => <option key={intent}>{intent}</option>)}
            </select>
            <input type="text" value={formData.external_link} onChange={(event) => updateField('external_link', event.target.value)} placeholder="Link opcional" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white" />
            <input type="text" value={formData.image} onChange={(event) => updateField('image', event.target.value)} placeholder="URL da imagem do card" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white md:col-span-2" />
          </div>

          {formData.image && (
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
              <img src={formData.image} alt="Preview" className="h-56 w-full rounded-2xl object-cover" />
            </div>
          )}

          <input type="text" value={formData.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Descrição curta" className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white" />
          <textarea value={formData.content} onChange={(event) => updateField('content', event.target.value)} placeholder="Conteúdo completo..." className="mt-4 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-relaxed outline-none focus:border-blue-500 focus:bg-white" />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={formData.is_featured} onChange={(event) => updateField('is_featured', event.target.checked)} /> Destaque
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={formData.is_published} onChange={(event) => updateField('is_published', event.target.checked)} /> Publicado para alunos
              </label>
            </div>
            <button type="button" onClick={saveItem} disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} {editingId ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Bloco de estatísticas */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
          {Object.entries(stats).map(([key, val]) => {
            const labels: Record<string, string> = { total: 'Total', featured: 'Destaques', prompts: 'Prompts e Roteiros', links: 'Links' };
            return (
              <div key={key} className="rounded-xl sm:rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">{labels[key]}</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black text-slate-900">{val}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Caixa de Pesquisa e Filtros */}
      <div className="rounded-[20px] sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Biblioteca TikTok Shop</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              {isAdmin ? 'Gerencie conteúdos, agentes e estratégias.' : 'Acesse conteúdos prontos para vender mais.'}
            </p>
          </div>
          <div className="self-start rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
            {filteredItems.length} disponíveis
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[1fr_220px_240px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conteúdos..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white" />
          </div>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option>Todos</option>
            {itemTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
          <select value={selectedIntent} onChange={(event) => setSelectedIntent(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option>Todas</option>
            {itemIntents.map((intent) => <option key={intent}>{intent}</option>)}
          </select>
        </div>
      </div>

      {/* GRID CONFIGURADO EM 3 COLUNAS PARA O MOBILE */}
      {loading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-slate-200 bg-white p-12 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} /> Carregando conteúdos...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <ShoppingBag size={30} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-black text-slate-900">Nenhum conteúdo encontrado</h3>
        </div>
      ) : (
        /* O segredo: grid-cols-3 puro para o mobile integrado sem quebras espaciais */
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => {
            const TypeIcon = getTypeIcon(item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex min-w-0 flex-col overflow-hidden rounded-[12px] sm:rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Banner de Imagem / Ícone superior do Card */}
                <div className="relative h-16 xs:h-20 sm:h-40 overflow-hidden bg-slate-100">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                      <TypeIcon size={24} className="text-slate-400 sm:size-[38px]" />
                    </div>
                  )}

                  {/* Etiquetas superiores reduzidas para caber no Mobile */}
                  <div className="absolute left-1 top-1 flex flex-wrap gap-0.5 sm:left-3 sm:top-3 sm:gap-2">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[7px] sm:text-xs font-black uppercase text-slate-900 shadow-xs max-w-[50px] sm:max-w-none truncate">
                      {item.type}
                    </span>

                    {item.is_featured && (
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[7px] sm:text-xs font-black text-slate-900 shadow-xs">
                        PRO
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                      <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[7px] sm:text-xs font-black shadow-xs ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.is_published ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span className="hidden xs:inline">{item.is_published ? 'Publicado' : 'Oculto'}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Área de conteúdo do texto */}
                <div className="flex flex-1 flex-col p-1.5 sm:p-4">
                  {/* Badge de Intenção */}
                  <span className="mb-1.5 inline-block rounded bg-slate-100 px-1 py-0.5 text-[7px] sm:text-xs font-black text-slate-600 max-w-full truncate self-start">
                    {item.intent}
                  </span>

                  {/* Título responsivo menor */}
                  <h3 className="line-clamp-2 min-h-[24px] text-[10px] sm:text-base font-black leading-tight text-slate-900 sm:min-h-[56px]">
                    {item.title}
                  </h3>

                  {/* Descrições longas ocultas no mobile para preservar as 3 colunas limpas */}
                  <p className="mt-1 hidden sm:line-clamp-2 text-sm font-medium leading-relaxed text-slate-500">
                    {item.description}
                  </p>

                  {item.content && (
                    <div className="mt-2 hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 md:block">
                      <p className="line-clamp-3 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600">
                        {item.content}
                      </p>
                    </div>
                  )}

                  {/* Botões estruturais verticais e responsivos na base */}
                  <div className="mt-auto flex flex-col gap-1 pt-1.5 sm:gap-2 sm:pt-3">
                    {item.external_link && (
                      <a
                        href={item.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 items-center justify-center gap-1 rounded-md bg-blue-600 text-[9px] sm:text-xs font-black text-white hover:bg-blue-700 sm:h-12"
                      >
                        <ExternalLink size={10} className="sm:size-3.5" />
                        <span>Abrir</span>
                      </a>
                    )}

                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {item.content && (
                        <button
                          type="button"
                          onClick={() => copyContent(item)}
                          className="flex h-7 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white text-[9px] sm:text-xs font-black text-slate-700 hover:bg-slate-50 sm:h-11"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={10} className="text-emerald-600 sm:size-3.5" />
                              <span className="text-emerald-600">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} className="sm:size-3.5" />
                              <span>Prompt</span>
                            </>
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => editItem(item)}
                          className="flex h-7 items-center justify-center gap-1 rounded-md bg-amber-500 text-[9px] sm:text-xs font-black text-white hover:bg-amber-600 sm:h-11"
                        >
                          <Pencil size={10} className="sm:size-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        disabled={deletingId === item.id}
                        className="flex h-7 items-center justify-center gap-1 rounded-md bg-red-500 text-[9px] sm:text-xs font-black text-white hover:bg-red-600 disabled:opacity-70 sm:h-11"
                      >
                        {deletingId === item.id ? <Loader2 className="animate-spin" size={10} /> : <Trash2 size={10} className="sm:size-3.5" />}
                        <span>Excluir</span>
                      </button>
                    )}
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

export default TikTokShop;