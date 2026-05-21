import React, { useEffect, useState } from 'react';
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

export default function TikTokShop() {
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

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            search === '' ||
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.type.toLowerCase().includes(search.toLowerCase()) ||
            item.intent.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.content.toLowerCase().includes(search.toLowerCase());

        const matchesType = selectedType === 'Todos' || item.type === selectedType;

        const matchesIntent =
            selectedIntent === 'Todas' || item.intent === selectedIntent;

        return matchesSearch && matchesType && matchesIntent;
    });

    const stats = {
        total: items.length,
        featured: items.filter((item) => item.is_featured).length,
        prompts: items.filter(
            (item) => item.type === 'Prompt' || item.type === 'Roteiro'
        ).length,
        links: items.filter((item) => item.external_link).length,
    };

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
                text: 'Erro ao salvar conteúdo.',
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
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 sm:space-y-8">
            {/* Banner Principal */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-6 text-white shadow-xl sm:p-10"
            >
                <div className="relative z-10 max-w-3xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 sm:mb-6 sm:h-14 sm:w-14">
                        <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>

                    <h1 className="text-2xl font-black sm:text-4xl">TikTok Shop</h1>

                    <p className="mt-1 text-lg font-bold text-white/95 sm:mt-2 sm:text-xl">
                        Domine as vendas no ecossistema do TikTok
                    </p>

                    <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/80 sm:mt-4 sm:text-base">
                        Estratégias, prompts, roteiros, checklists e agentes para encontrar
                        produtos, criar vídeos e vender todos os dias.
                    </p>
                </div>

                <ShoppingBag className="absolute -right-10 bottom-0 h-44 w-44 text-white/10 sm:h-56 sm:w-56" />
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
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                                {editingId ? 'Editar Conteúdo TikTok Shop' : 'Novo Conteúdo TikTok Shop'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
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

                    <input type="text" value={formData.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Descrição curta" className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white" />
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Object.entries(stats).map(([key, val]) => {
                        const labels: Record<string, string> = { total: 'Total', featured: 'Destaques', prompts: 'Prompts e Roteiros', links: 'Links' };
                        return (
                            <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{labels[key]}</p>
                                <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{val}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filtros */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Biblioteca TikTok Shop</h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            {isAdmin ? 'Gerencie conteúdos, agentes e estratégias.' : 'Acesse conteúdos prontos para vender mais.'}
                        </p>
                    </div>
                    <div className="self-start rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        {filteredItems.length} disponíveis
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_240px]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conteúdos..." className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white" />
                    </div>
                    <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option>Todos</option>
                        {itemTypes.map((type) => <option key={type}>{type}</option>)}
                    </select>
                    <select value={selectedIntent} onChange={(event) => setSelectedIntent(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option>Todas</option>
                        {itemIntents.map((intent) => <option key={intent}>{intent}</option>)}
                    </select>
                </div>
            </div>

            {/* Lista Padrão de Conteúdos */}
            {filteredItems.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <ShoppingBag size={36} className="mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-black text-slate-900">Nenhum conteúdo encontrado</h3>
                    <p className="mt-1 text-sm text-slate-500">Tente mudar os termos da busca ou filtros.</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item, index) => {
                    const TypeIcon = getTypeIcon(item.type);

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                        <TypeIcon size={40} className="text-slate-400" />
                                    </div>
                                )}

                                <div className="absolute left-4 top-4 flex gap-2">
                                    <span className="rounded-xl bg-white px-3 py-1 text-xs font-black uppercase text-slate-900 shadow-sm">
                                        {item.type}
                                    </span>
                                    {item.is_featured && (
                                        <span className="rounded-xl bg-amber-400 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                                            Destaque
                                        </span>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="absolute bottom-4 right-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black shadow-sm ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {item.is_published ? 'Publicado' : 'Oculto'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col p-5 sm:p-6">
                                <span className="mb-2 inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 self-start">
                                    {item.intent}
                                </span>

                                <h3 className="text-lg font-black leading-tight text-slate-900 sm:text-xl">
                                    {item.title}
                                </h3>

                                <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-slate-500">
                                    {item.description}
                                </p>

                                {item.content && (
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="line-clamp-4 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600">
                                            {item.content}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col gap-2 pt-2">
                                    {item.external_link && (
                                        <a
                                            href={item.external_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
                                        >
                                            <ExternalLink size={16} />
                                            Acessar Conteúdo Externo
                                        </a>
                                    )}

                                    {item.content && (
                                        <button
                                            type="button"
                                            onClick={() => copyContent(item)}
                                            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
                                        >
                                            {copiedId === item.id ? (
                                                <>
                                                    <Check size={16} className="text-emerald-600" />
                                                    <span className="text-emerald-600">Copiado para a Área de Transferência!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copiar Material Completo
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {isAdmin && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => editItem(item)}
                                                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-black text-white transition hover:bg-amber-600"
                                            >
                                                <Pencil size={16} />
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteItem(item)}
                                                disabled={deletingId === item.id}
                                                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-70"
                                            >
                                                {deletingId === item.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
