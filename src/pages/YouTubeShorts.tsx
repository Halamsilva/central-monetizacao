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
  Youtube,
  Star,
  Target,
  Trash2,
  Video,
  Play,
  X
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface YouTubeItem {
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
  'Thumbnail',
  'Link',
];

const itemIntents = [
  'Reter Audiência',
  'Criar Gancho viral',
  'SEO para Vídeos',
  'Crescer Canal',
  'Monetizar Shorts',
  'Analisar Algoritmo',
];

const draftKey = 'youtube_page_draft';

const emptyForm = {
  title: '',
  type: 'Estratégia',
  intent: 'Reter Audiência',
  description: '',
  content: '',
  external_link: '',
  image: '',
  is_featured: false,
  is_published: true,
};

// Carrega o rascunho salvo se o usuário sair da página sem querer
const getInitialForm = () => {
  const savedDraft = localStorage.getItem(draftKey);
  if (!savedDraft) return emptyForm;
  try {
    return JSON.parse(savedDraft);
  } catch {
    return emptyForm;
  }
};

const YouTubePage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<YouTubeItem[]>([]);
  const [formData, setFormData] = useState(getInitialForm);
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

  // Salva o rascunho automaticamente a cada letra digitada
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const loadItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('youtube_items')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!isAdmin) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar conteúdos do YouTube.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !term || item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
      const matchesType = selectedType === 'Todos' || item.type === selectedType;
      const matchesIntent = selectedIntent === 'Todas' || item.intent === selectedIntent;
      return matchesSearch && matchesType && matchesIntent;
    });
  }, [items, search, selectedType, selectedIntent]);

  const updateField = (field: keyof typeof emptyForm, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    localStorage.removeItem(draftKey);
  };

  const saveItem = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        external_link: formData.external_link.trim() || null,
        image: formData.image.trim() || null
      };

      if (editingId) {
        const { error } = await supabase.from('youtube_items').update(payload).eq('id', editingId);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Atualizado com sucesso.' });
      } else {
        const { error } = await supabase.from('youtube_items').insert([payload]);
        if (error) throw error;

        // Dispara notificação automática para os alunos no mural de avisos
        await supabase
          .from('notifications')
          .insert([
            {
              title: `📺 Novo conteúdo de YouTube!`,
              message: `O material "${payload.title}" foi adicionado em estratégias de YouTube e Shorts. Confira!`,
              type: 'youtube_shorts'
            }
          ]);

        setMessage({ type: 'success', text: 'Criado e alunos notificados com sucesso!' });
      }

      resetForm();
      await loadItems();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const copyContent = async (item: YouTubeItem) => {
    await navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Roteiro') return Video;
    if (type === 'Prompt') return FileText;
    if (type === 'Thumbnail') return Play;
    return Youtube;
  };

  const hasDraft =
    formData.title ||
    formData.description ||
    formData.image ||
    formData.content ||
    formData.external_link;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4">
      {/* Banner YouTube e Shorts */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-10 text-white shadow-xl shadow-red-100"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Youtube size={28} />
          </div>
          <h1 className="text-4xl font-black">YouTube e Shorts</h1>
          <p className="mt-3 text-xl font-bold text-white/95">Crescimento acelerado com vídeos curtos</p>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80">
            Templates de roteiros virais, análise de algoritmos e agentes de IA focados em criar canais poderosos para YouTube e Shorts.
          </p>
        </div>
        <Youtube className="absolute -right-10 bottom-0 h-56 w-56 text-white/10" />
      </motion.div>

      {/* ADMIN FORM - PROTEGIDO COM RASCUNHO AUTOMÁTICO */}
      {isAdmin && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Editar Conteúdo YouTube' : 'Novo Conteúdo YouTube'}</h2>
            <div className="flex flex-wrap gap-2">
              {hasDraft && (
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  <X size={12} /> Limpar rascunho
                </button>
              )}
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700转">Rascunho protegido</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="Título *" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none focus:border-red-500" />
            <select value={formData.type} onChange={e => updateField('type', e.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none">
              {itemTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={formData.intent} onChange={e => updateField('intent', e.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none">
              {itemIntents.map(i => <option key={i}>{i}</option>)}
            </select>
            <input type="text" value={formData.external_link} onChange={e => updateField('external_link', e.target.value)} placeholder="Link do botão (Opcional)" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-red-500" />
            <input type="text" value={formData.image} onChange={e => updateField('image', e.target.value)} placeholder="URL da imagem do card (Opcional)" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 md:col-span-2 outline-none focus:border-red-500" />
          </div>

          <div className="flex flex-col gap-1">
            <input type="text" value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Breve descrição do card *" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none focus:border-red-500" />
          </div>

          <textarea value={formData.content} onChange={e => updateField('content', e.target.value)} placeholder="Cole aqui o Roteiro, Prompt ou Estratégia completa..." className="w-full min-h-40 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium outline-none focus:border-red-500" />

          <button onClick={saveItem} disabled={saving} className="w-full h-12 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Publicar no YouTube'}
          </button>
        </div>
      )}

      {/* Alerta de Feedback */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-white text-sm ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_240px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conteúdos do YouTube..." className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-red-500 transition" />
          </div>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none">
            <option>Todos</option>
            {itemTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={selectedIntent} onChange={e => setSelectedIntent(e.target.value)} className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none">
            <option>Todas</option>
            {itemIntents.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Grid de Conteúdos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item, index) => {
          const TypeIcon = getTypeIcon(item.type);
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm hover:-translate-y-1 transition hover:shadow-lg">
              <div className="relative h-40 bg-slate-100">
                {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-red-50"><TypeIcon size={40} className="text-red-400" /></div>}
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-900 shadow-sm">{item.type}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="mb-2 text-[10px] font-black uppercase tracking-wider text-red-600">{item.intent}</span>
                <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500">{item.description}</p>
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  {item.external_link && <a href={item.external_link} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-black text-white hover:bg-red-700 transition"><ExternalLink size={14} /> Abrir Link</a>}
                  <button onClick={() => copyContent(item)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 transition">
                    {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />} {copiedId === item.id ? 'Copiado' : 'Copiar Prompt'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default YouTubePage;
