import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
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
  Facebook,
  Star,
  Target,
  Trash2,
  Video,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface FacebookItem {
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
  'Funil de Vendas',
  'Link',
];

const itemIntents = [
  'Criar Contingência',
  'Subir Campanha',
  'Escrever Copy',
  'Ganha em Dólar',
  'Monetizar Página',
  'Analisar Métrica',
];

const draftKey = 'facebook_page_draft';

const emptyForm = {
  title: '',
  type: 'Estratégia',
  intent: 'Subir Campanha',
  description: '',
  content: '',
  external_link: '',
  image: '',
  is_featured: false,
  is_published: true,
};

const FacebookPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<FacebookItem[]>([]);
  const [formData, setFormData] = useState(emptyForm);

  // Restaura rascunho ao montar
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Salva rascunho automaticamente a cada alteracao
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData]);

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

      // Altere aqui se o nome da sua tabela no Supabase for diferente
      let query = supabase
        .from('facebook_items')
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
          text: 'Erro ao carregar conteúdos de Facebook Ads.',
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
    localStorage.removeItem(draftKey);
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
          .from('facebook_items')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Conteúdo atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('facebook_items')
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

  const editItem = (item: FacebookItem) => {
    setEditingId(item.id);

    setFormData({
      title: item.title || '',
      type: item.type || 'Estratégia',
      intent: item.intent || 'Subir Campanha',
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

  const deleteItem = async (item: FacebookItem) => {
    const confirmDelete = confirm(
      `Tem certeza que deseja excluir "${item.title}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(item.id);

      const { error } = await supabase
        .from('facebook_items')
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

  const copyContent = async (item: FacebookItem) => {
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
    if (type === 'Funil de Vendas') return PackageSearch;
    if (type === 'Link') return LinkIcon;

    return Facebook;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:space-y-8 sm:p-4">
      {/* Banner Principal customizado do Facebook com Gradiente Azul */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-6 text-white shadow-xl shadow-blue-100 sm:rounded-[32px] sm:p-10"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 sm:mb-6 sm:h-14 sm:w-14">
            <Facebook size={24} className="sm:size-7" />
          </div>

          <h1 className="max-w-[12ch] text-4xl font-black leading-[0.95] sm:max-w-none sm:text-4xl lg:text-5xl">
            Facebook Ads & Monetização
          </h1>

          <p className="mt-4 text-xl font-bold leading-tight text-white/95 sm:mt-3">
            Escalando ganhos com tráfego e conteúdo
          </p>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/80 sm:mt-5 sm:text-base">
            Aprenda a monetizar páginas, criar anúncios de alta conversão e utilizar IA
            para automatizar sua produção de conteúdo no ecossistema Meta.
          </p>
        </div>

        <Facebook className="absolute -right-12 bottom-0 h-44 w-44 text-white/10 sm:-right-10 sm:h-56 sm:w-56" />
      </motion.div>

      {/* Alertas e Mensagens do Formulário */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-700'
            }`}
        >
          {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Painel Administrativo do Facebook */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                {editingId ? 'Editar Conteúdo Facebook' : 'Novo Conteúdo Facebook'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre materiais que os alunos poderão acessar na biblioteca do Facebook.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="h-10 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
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
              onChange={(event) => updateField('external_link', event.target.value)}
              placeholder="Link opcional"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <input
              type="text"
              value={formData.image}
              onChange={(event) => updateField('image', event.target.value)}
              placeholder="URL da imagem do card"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white md:col-span-2"
            />
          </div>

          {formData.image && (
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
              <img
                src={formData.image}
                alt="Preview da imagem"
                className="h-56 w-full rounded-2xl object-cover"
              />
            </div>
          )}

          <input
            type="text"
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Descrição curta"
            className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <textarea
            value={formData.content}
            onChange={(event) => updateField('content', event.target.value)}
            placeholder="Conteúdo completo, estratégia, checklist ou prompt do Facebook Ads..."
            className="mt-4 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-relaxed outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(event) => updateField('is_featured', event.target.checked)}
                />
                Destaque
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(event) => updateField('is_published', event.target.checked)}
                />
                Publicado para alunos
              </label>
            </div>

            <button
              type="button"
              onClick={saveItem}
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70 sm:w-auto"
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

      {/* Estatísticas do Dashboard */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Destaques</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{stats.featured}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Prompts e Roteiros</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{stats.prompts}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Links</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{stats.links}</p>
          </div>
        </div>
      )}

      {/* Lista da Biblioteca de Cards do Facebook */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black leading-tight text-slate-900 sm:text-2xl">
              Biblioteca Facebook Monetização
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? 'Gerencie conteúdos, funis e estratégias para Facebook Ads.'
                : 'Acesse conteúdos prontos para alavancar suas campanhas no Facebook.'}
            </p>
          </div>

          <div className="self-start rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            {filteredItems.length} disponíveis
          </div>
        </div>

        {/* Barra de Filtros Inteligentes Dinâmicos */}
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_240px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, descrição ou conteúdo do Facebook"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white sm:h-14 sm:pl-12"
            />
          </div>

          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white sm:h-14"
          >
            <option>Todos</option>
            {itemTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            value={selectedIntent}
            onChange={(event) => setSelectedIntent(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white sm:h-14"
          >
            <option>Todas</option>
            {itemIntents.map((intent) => (
              <option key={intent}>{intent}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Renderização Condicional da Listagem / Loading */}
      {loading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm sm:rounded-[28px] sm:p-12">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            Carregando conteúdos de Facebook Ads...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-[28px] sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
            <Facebook size={30} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Nenhum conteúdo encontrado</h3>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? 'Cadastre o primeiro conteúdo de Facebook no formulário acima.'
              : 'Novos conteúdos do ecossistema Meta aparecerão aqui em breve.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => {
            const TypeIcon = getTypeIcon(item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-[24px]"
              >
                <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-40">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <TypeIcon size={38} className="text-slate-400" />
                    </div>
                  )}

                  <div className="absolute left-2 top-2 flex max-w-[calc(100%-16px)] flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-2">
                    <span className="max-w-full truncate rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-900 shadow-sm sm:px-3 sm:text-xs">
                      {item.type}
                    </span>
                    {item.is_featured && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[9px] font-black text-white shadow-sm sm:px-3 sm:text-xs">
                        PRO
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="absolute bottom-2 right-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black shadow-sm sm:px-3 sm:text-xs ${item.is_published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.is_published ? 'Publicado' : 'Oculto'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
                  <span className="mb-2 max-w-full truncate rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 sm:px-3 sm:text-xs">
                    {item.intent}
                  </span>

                  <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-black leading-tight text-slate-900 sm:min-h-[56px] sm:text-xl">
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 sm:mt-2 sm:text-sm sm:leading-relaxed">
                    {item.description}
                  </p>

                  {item.content && (
                    <div className="mt-2 hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:block">
                      <p className="line-clamp-3 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600">
                        {item.content}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-2 pt-3">
                    {item.external_link && (
                      <a
                        href={item.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 text-[11px] font-black text-white transition hover:bg-blue-700 sm:h-12 sm:gap-2 sm:text-sm"
                      >
                        <ExternalLink size={15} />
                        Abrir Link
                      </a>
                    )}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {item.content && (
                        <button
                          type="button"
                          onClick={() => copyContent(item)}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-[11px] font-black text-slate-700 transition hover:bg-slate-50 sm:h-11 sm:gap-2 sm:text-sm"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={15} />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={15} />
                              Prompt
                            </>
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => editItem(item)}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 text-[11px] font-black text-white transition hover:bg-amber-600 sm:h-11 sm:gap-2 sm:text-sm"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        disabled={deletingId === item.id}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-500 text-[11px] font-black text-white transition hover:bg-red-600 disabled:opacity-70 sm:h-11 sm:gap-2 sm:text-sm"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        Excluir
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

export default FacebookPage;
