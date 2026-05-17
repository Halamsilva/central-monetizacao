import React, { useEffect, useState } from 'react';
import {
    Plus,
    Trash2,
    Upload,
    Pencil,
    Loader2,
    RefreshCw,
    Check,
    AlertCircle,
    Bot,
    Star,
    Search,
    ExternalLink,
    X,
    Sparkles,
    Tags,
    ImageOff,
    Link,
    Clipboard,
    ArrowUp,
    BadgeCheck,
    CircleAlert,
    Files,
    MoreHorizontal,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Agent {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    agent_link: string;
    prompt: string;
    featured: boolean;
    created_at?: string;
}

const draftKey = 'central_admin_agent_draft';

const emptyForm = {
    title: '',
    description: '',
    image: '',
    category: '',
    agent_link: '',
    prompt: '',
    featured: false,
};

const getInitialForm = () => {
    const savedDraft = localStorage.getItem(draftKey);

    if (!savedDraft) {
        return emptyForm;
    }

    try {
        return JSON.parse(savedDraft);
    } catch {
        return emptyForm;
    }
};

const normalizeText = (value?: string) => {
    return value?.trim().toLowerCase() || '';
};

const normalizeCategoryKey = (category?: string) => {
    return normalizeText(category);
};

const formatCategoryLabel = (category?: string) => {
    if (!category) return 'Sem Categoria';

    return category
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const isValidUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);

        return (
            parsedUrl.protocol === 'http:' ||
            parsedUrl.protocol === 'https:'
        );
    } catch {
        return false;
    }
};

const getAgentQuality = (agent: Agent) => {
    const hasImage = Boolean(agent.image);
    const hasDescription = Boolean(agent.description?.trim());
    const hasPrompt = Boolean(agent.prompt?.trim());
    const hasLink =
        Boolean(agent.agent_link?.trim()) && isValidUrl(agent.agent_link);
    const hasCategory = Boolean(agent.category?.trim());

    const items = [
        { label: 'Imagem', complete: hasImage },
        { label: 'Descrição', complete: hasDescription },
        { label: 'Prompt', complete: hasPrompt },
        { label: 'Link', complete: hasLink },
        { label: 'Categoria', complete: hasCategory },
    ];

    const completed = items.filter((item) => item.complete).length;

    return {
        items,
        completed,
        total: items.length,
        isComplete: completed === items.length,
    };
};

const AdminAgents = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [formData, setFormData] = useState(getInitialForm);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [isSavingAgent, setIsSavingAgent] = useState(false);
    const [deletingAgentId, setDeletingAgentId] = useState<string | null>(
        null
    );
    const [openActionsId, setOpenActionsId] = useState<string | null>(
        null
    );
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [featuredFilter, setFeaturedFilter] = useState<
        'all' | 'featured' | 'incomplete'
    >('all');
    const [sortBy, setSortBy] = useState<
        'recent' | 'title' | 'category' | 'featured'
    >('recent');

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
    }, [formData]);

    const showSuccessMessage = (message: string) => {
        setSuccessMessage(message);
        setErrorMessage('');

        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const showErrorMessage = (message: string) => {
        setErrorMessage(message);
        setSuccessMessage('');

        setTimeout(() => {
            setErrorMessage('');
        }, 4000);
    };

    const fetchAgents = async () => {
        setIsLoadingAgents(true);

        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showErrorMessage('Erro ao carregar agentes.');
            setIsLoadingAgents(false);
            return;
        }

        setAgents(data || []);
        setIsLoadingAgents(false);
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
        localStorage.removeItem(draftKey);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setFeaturedFilter('all');
        setSortBy('recent');
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const copyToClipboard = async (value: string, successText: string) => {
        if (!value.trim()) {
            showErrorMessage('Nada para copiar.');
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            showSuccessMessage(successText);
        } catch {
            showErrorMessage('Não foi possível copiar.');
        }
    };

    const hasActiveFilters =
        searchTerm.trim() !== '' ||
        categoryFilter !== 'all' ||
        featuredFilter !== 'all' ||
        sortBy !== 'recent';

    const hasDraft =
        formData.title ||
        formData.description ||
        formData.image ||
        formData.category ||
        formData.agent_link ||
        formData.prompt ||
        formData.featured;

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('agent-images')
                .upload(fileName, file);

            if (error) {
                console.error(error);
                showErrorMessage('Erro ao enviar imagem.');
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage
                .from('agent-images')
                .getPublicUrl(fileName);

            updateField('image', publicUrl);
            showSuccessMessage('Imagem enviada com sucesso.');
        } catch (err) {
            console.error(err);
            showErrorMessage('Erro no upload da imagem.');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.title.trim()) {
            showErrorMessage('Digite o título do agente.');
            return;
        }

        if (!formData.category.trim()) {
            showErrorMessage('Digite a categoria.');
            return;
        }

        if (!formData.agent_link.trim()) {
            showErrorMessage('Cole o link do agente.');
            return;
        }

        if (!isValidUrl(formData.agent_link.trim())) {
            showErrorMessage(
                'Use um link válido começando com http:// ou https://.'
            );
            return;
        }

        if (!formData.description.trim()) {
            showErrorMessage('Digite uma descrição para o agente.');
            return;
        }

        if (!formData.prompt.trim()) {
            showErrorMessage('Digite o prompt do agente.');
            return;
        }

        const normalizedTitle = normalizeText(formData.title);
        const titleAlreadyExists = agents.some((agent) => {
            const isSameTitle = normalizeText(agent.title) === normalizedTitle;
            const isCurrentAgent = editingId === agent.id;

            return isSameTitle && !isCurrentAgent;
        });

        if (titleAlreadyExists) {
            showErrorMessage('Já existe um agente com esse título.');
            return;
        }

        setIsSavingAgent(true);

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            image: formData.image.trim(),
            category: formatCategoryLabel(formData.category),
            agent_link: formData.agent_link.trim(),
            prompt: formData.prompt.trim(),
            featured: formData.featured,
        };

        if (editingId) {
            const { error } = await supabase
                .from('agents')
                .update(payload)
                .eq('id', editingId);

            if (error) {
                console.error(error);
                showErrorMessage('Erro ao atualizar agente.');
                setIsSavingAgent(false);
                return;
            }

            showSuccessMessage('Agente atualizado com sucesso.');
        } else {
            const { error } = await supabase
                .from('agents')
                .insert([payload]);

            if (error) {
                console.error(error);
                showErrorMessage('Erro ao criar agente.');
                setIsSavingAgent(false);
                return;
            }

            showSuccessMessage('Agente criado com sucesso.');
        }

        resetForm();
        await fetchAgents();
        setIsSavingAgent(false);
    };

    const handleEdit = (agent: Agent) => {
        setEditingId(agent.id);
        setOpenActionsId(null);

        setFormData({
            title: agent.title || '',
            description: agent.description || '',
            image: agent.image || '',
            category: formatCategoryLabel(agent.category),
            agent_link: agent.agent_link || '',
            prompt: agent.prompt || '',
            featured: agent.featured || false,
        });

        scrollToTop();
    };

    const handleDuplicate = (agent: Agent) => {
        setEditingId(null);
        setOpenActionsId(null);

        setFormData({
            title: `${agent.title} - Cópia`,
            description: agent.description || '',
            image: agent.image || '',
            category: formatCategoryLabel(agent.category),
            agent_link: agent.agent_link || '',
            prompt: agent.prompt || '',
            featured: false,
        });

        showSuccessMessage('Agente duplicado no formulário. Revise e salve.');
        scrollToTop();
    };

    const handleDelete = async (agent: Agent) => {
        const confirmDelete = confirm(
            `Deseja excluir o agente "${agent.title}"? Essa ação não pode ser desfeita.`
        );

        if (!confirmDelete) return;

        setOpenActionsId(null);
        setDeletingAgentId(agent.id);

        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agent.id);

        if (error) {
            console.error(error);
            showErrorMessage('Erro ao excluir agente.');
            setDeletingAgentId(null);
            return;
        }

        showSuccessMessage('Agente excluído com sucesso.');
        await fetchAgents();
        setDeletingAgentId(null);
    };

    const categories = Array.from(
        agents.reduce((map, agent) => {
            const categoryKey = normalizeCategoryKey(agent.category);

            if (!categoryKey) return map;

            const current = map.get(categoryKey);

            if (!current) {
                map.set(categoryKey, {
                    key: categoryKey,
                    label: formatCategoryLabel(agent.category),
                    count: 1,
                });

                return map;
            }

            map.set(categoryKey, {
                ...current,
                count: current.count + 1,
            });

            return map;
        }, new Map<string, { key: string; label: string; count: number }>())
    )
        .map(([, category]) => category)
        .sort((categoryA, categoryB) =>
            categoryA.label.localeCompare(categoryB.label)
        );

    const totalFeatured = agents.filter((agent) => agent.featured).length;
    const totalCategories = categories.length;
    const totalIncomplete = agents.filter(
        (agent) => !getAgentQuality(agent).isComplete
    ).length;

    const sortedAgents = [...agents].sort((agentA, agentB) => {
        if (sortBy === 'featured') {
            if (agentA.featured !== agentB.featured) {
                return agentA.featured ? -1 : 1;
            }

            return agentA.title.localeCompare(agentB.title);
        }

        if (sortBy === 'title') {
            return agentA.title.localeCompare(agentB.title);
        }

        if (sortBy === 'category') {
            const categoryComparison = formatCategoryLabel(
                agentA.category
            ).localeCompare(formatCategoryLabel(agentB.category));

            if (categoryComparison !== 0) return categoryComparison;

            return agentA.title.localeCompare(agentB.title);
        }

        return (
            new Date(agentB.created_at || '').getTime() -
            new Date(agentA.created_at || '').getTime()
        );
    });

    const filteredAgents = sortedAgents.filter((agent) => {
        const search = searchTerm.toLowerCase().trim();
        const agentCategoryKey = normalizeCategoryKey(agent.category);
        const quality = getAgentQuality(agent);

        const matchesSearch =
            search === '' ||
            agent.title?.toLowerCase().includes(search) ||
            agent.description?.toLowerCase().includes(search) ||
            agent.category?.toLowerCase().includes(search);

        const matchesCategory =
            categoryFilter === 'all' ||
            agentCategoryKey === categoryFilter;

        const matchesFeatured =
            featuredFilter === 'all' ||
            (featuredFilter === 'featured' && agent.featured) ||
            (featuredFilter === 'incomplete' && !quality.isComplete);

        return matchesSearch && matchesCategory && matchesFeatured;
    });

    return (
        <div className="mx-auto max-w-[1560px] p-6 pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">
                    Painel Admin
                </h1>

                <p className="mt-2 text-slate-500">
                    Gerencie os agentes da plataforma.
                </p>
            </div>

            {successMessage && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <Check className="h-4 w-4" />
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {errorMessage}
                </div>
            )}

            <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {editingId ? 'Editar Agente' : 'Novo Agente'}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Cadastre agentes premium para a biblioteca.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {hasDraft && (
                            <button
                                onClick={resetForm}
                                disabled={isSavingAgent}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed"
                            >
                                <X className="h-3 w-3" />
                                Limpar rascunho
                            </button>
                        )}

                        <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Rascunho salvo automaticamente
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                        type="text"
                        placeholder="Título"
                        value={formData.title}
                        onChange={(e) =>
                            updateField('title', e.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                        type="text"
                        placeholder="Categoria"
                        value={formData.category}
                        onChange={(e) =>
                            updateField('category', e.target.value)
                        }
                        onBlur={() =>
                            updateField(
                                'category',
                                formatCategoryLabel(formData.category)
                            )
                        }
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="mt-4">
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Upload size={16} />
                        Upload da Imagem
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />

                    {!formData.image && (
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-600">
                            <ImageOff className="h-4 w-4" />
                            Imagem recomendada para manter o catálogo premium.
                        </p>
                    )}

                    {uploading && (
                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando imagem...
                        </p>
                    )}

                    {formData.image && (
                        <img
                            src={formData.image}
                            alt="Preview"
                            className="mt-4 h-64 w-full rounded-2xl border border-slate-200 object-cover"
                        />
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Link do Agente"
                    value={formData.agent_link}
                    onChange={(e) =>
                        updateField('agent_link', e.target.value)
                    }
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <div className="mt-4">
                    <textarea
                        placeholder="Descrição"
                        value={formData.description}
                        onChange={(e) =>
                            updateField('description', e.target.value)
                        }
                        maxLength={240}
                        className="h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-right text-xs font-medium text-slate-400">
                        {formData.description.length}/240
                    </p>
                </div>

                <textarea
                    placeholder="Prompt"
                    value={formData.prompt}
                    onChange={(e) =>
                        updateField('prompt', e.target.value)
                    }
                    className="mt-4 h-40 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <label className="mt-4 flex w-fit items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) =>
                            updateField('featured', e.target.checked)
                        }
                        className="h-4 w-4"
                    />

                    Destaque
                </label>

                <div className="mt-6 flex flex-wrap gap-4">
                    <button
                        onClick={handleCreateOrUpdate}
                        disabled={isSavingAgent || uploading}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {isSavingAgent ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Plus size={18} />
                        )}

                        {isSavingAgent
                            ? 'Salvando...'
                            : editingId
                                ? 'Salvar Alterações'
                                : 'Criar Agente'}
                    </button>

                    {editingId && (
                        <button
                            onClick={resetForm}
                            disabled={isSavingAgent}
                            className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">
                            Total
                        </span>

                        <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                            <Bot className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-slate-900">
                        {agents.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">
                            Destaques
                        </span>

                        <span className="rounded-full bg-amber-100 p-2 text-amber-700">
                            <Sparkles className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-slate-900">
                        {totalFeatured}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">
                            Categorias
                        </span>

                        <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                            <Tags className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-slate-900">
                        {totalCategories}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">
                            Incompletos
                        </span>

                        <span className="rounded-full bg-red-100 p-2 text-red-700">
                            <CircleAlert className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-slate-900">
                        {totalIncomplete}
                    </p>
                </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">
                        Agentes cadastrados
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Organize, edite e remova agentes da biblioteca.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchAgents}
                        disabled={isLoadingAgents}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isLoadingAgents ? 'animate-spin' : ''
                                }`}
                        />
                        Atualizar
                    </button>

                    <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {filteredAgents.length} de {agents.length} agentes
                    </div>
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            placeholder="Buscar por título, descrição ou categoria"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(e.target.value)
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="all">Todas as categorias</option>

                        {categories.map((category) => (
                            <option key={category.key} value={category.key}>
                                {category.label} ({category.count})
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(
                                e.target.value as
                                | 'recent'
                                | 'title'
                                | 'category'
                                | 'featured'
                            )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="recent">Mais recentes</option>
                        <option value="featured">Destaques primeiro</option>
                        <option value="title">Título A-Z</option>
                        <option value="category">Categoria</option>
                    </select>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFeaturedFilter('all')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${featuredFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Todos
                        </button>

                        <button
                            onClick={() => setFeaturedFilter('featured')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${featuredFilter === 'featured'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                        >
                            <Star className="h-4 w-4" />
                            Destaques
                        </button>

                        <button
                            onClick={() => setFeaturedFilter('incomplete')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${featuredFilter === 'incomplete'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            <CircleAlert className="h-4 w-4" />
                            Incompletos
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                <X className="h-4 w-4" />
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoadingAgents ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

                    <h3 className="text-lg font-bold text-slate-800">
                        Carregando agentes...
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Sincronizando a biblioteca de agentes.
                    </p>
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Bot className="mx-auto mb-4 h-12 w-12 text-slate-400" />

                    <h3 className="text-lg font-bold text-slate-700">
                        Nenhum agente encontrado
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Ajuste a busca ou os filtros para visualizar outros agentes.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredAgents.map((agent) => {
                        const quality = getAgentQuality(agent);
                        const isActionsOpen = openActionsId === agent.id;

                        return (
                            <div
                                key={agent.id}
                                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                {agent.image ? (
                                    <img
                                        src={agent.image}
                                        alt={agent.title}
                                        className="mb-4 aspect-video w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                        <Bot className="h-10 w-10" />
                                    </div>
                                )}

                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {formatCategoryLabel(agent.category)}
                                    </span>

                                    {agent.featured && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                            <Star className="h-3 w-3" />
                                            Destaque
                                        </span>
                                    )}

                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${quality.isComplete
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-50 text-red-600'
                                            }`}
                                    >
                                        {quality.isComplete ? (
                                            <BadgeCheck className="h-3 w-3" />
                                        ) : (
                                            <CircleAlert className="h-3 w-3" />
                                        )}

                                        Qualidade {quality.completed}/
                                        {quality.total}
                                    </span>
                                </div>

                                <h2 className="mb-2 text-xl font-bold text-slate-900">
                                    {agent.title}
                                </h2>

                                <p className="mb-5 line-clamp-3 text-sm text-slate-500">
                                    {agent.description || 'Sem descrição.'}
                                </p>

                                {!quality.isComplete && (
                                    <div className="mb-5 flex flex-wrap gap-2">
                                        {quality.items
                                            .filter((item) => !item.complete)
                                            .map((item) => (
                                                <span
                                                    key={item.label}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                                                >
                                                    <CircleAlert className="h-3 w-3" />
                                                    Falta {item.label}
                                                </span>
                                            ))}
                                    </div>
                                )}

                                <div className="mt-auto grid gap-3">
                                    <a
                                        href={agent.agent_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Abrir
                                    </a>

                                    <div className="grid grid-cols-[1fr_auto] gap-3">
                                        <button
                                            onClick={() => handleEdit(agent)}
                                            disabled={
                                                deletingAgentId === agent.id
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                                        >
                                            <Pencil size={18} />
                                            Editar
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    setOpenActionsId(
                                                        isActionsOpen
                                                            ? null
                                                            : agent.id
                                                    )
                                                }
                                                disabled={
                                                    deletingAgentId ===
                                                    agent.id
                                                }
                                                className="inline-flex h-full items-center justify-center rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>

                                            {isActionsOpen && (
                                                <div className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                                    <button
                                                        onClick={() => {
                                                            copyToClipboard(
                                                                agent.prompt ||
                                                                '',
                                                                'Prompt copiado.'
                                                            );
                                                            setOpenActionsId(
                                                                null
                                                            );
                                                        }}
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <Clipboard className="h-4 w-4" />
                                                        Copiar prompt
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            copyToClipboard(
                                                                agent.agent_link ||
                                                                '',
                                                                'Link copiado.'
                                                            );
                                                            setOpenActionsId(
                                                                null
                                                            );
                                                        }}
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <Link className="h-4 w-4" />
                                                        Copiar link
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDuplicate(
                                                                agent
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <Files className="h-4 w-4" />
                                                        Duplicar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                agent
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                                    >
                                                        {deletingAgentId ===
                                                            agent.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                        Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
                <ArrowUp className="h-4 w-4" />
                Topo
            </button>
        </div>
    );
};

export default AdminAgents;