import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

const AdminAgents = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [formData, setFormData] = useState(getInitialForm);

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
    }, [formData]);

    const fetchAgents = async () => {
        const { data } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });

        setAgents(data || []);
    };

    const handleCreate = async () => {
        if (!formData.title.trim()) {
            alert('Digite o título do agente');
            return;
        }

        if (!formData.category.trim()) {
            alert('Digite a categoria do agente');
            return;
        }

        if (!formData.agent_link.trim()) {
            alert('Cole o link do agente');
            return;
        }

        const { error } = await supabase.from('agents').insert([
            {
                title: formData.title,
                description: formData.description,
                image: formData.image,
                category: formData.category,
                agent_link: formData.agent_link,
                prompt: formData.prompt,
                featured: formData.featured,
            },
        ]);

        if (error) {
            console.error(error);
            alert('Erro ao criar agente');
            return;
        }

        alert('Agente criado com sucesso');

        setFormData(emptyForm);
        localStorage.removeItem(draftKey);

        fetchAgents();
    };

    const handleDelete = async (id: string) => {
        const confirmDelete = confirm('Deseja excluir este agente?');

        if (!confirmDelete) return;

        await supabase.from('agents').delete().eq('id', id);

        fetchAgents();
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

    return (
        <div className="p-6 pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Painel Admin
                </h1>

                <p className="text-slate-500 mt-2">
                    Gerencie os agentes da plataforma
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        Novo Agente
                    </h2>

                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        Rascunho salvo automaticamente
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Título"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="text"
                        placeholder="Categoria"
                        value={formData.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="text"
                        placeholder="Imagem URL"
                        value={formData.image}
                        onChange={(e) => updateField('image', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="text"
                        placeholder="Link do Agente"
                        value={formData.agent_link}
                        onChange={(e) => updateField('agent_link', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <textarea
                    placeholder="Descrição"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full mt-4 border border-slate-200 rounded-xl px-4 py-3 h-28 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                    placeholder="Prompt"
                    value={formData.prompt}
                    onChange={(e) => updateField('prompt', e.target.value)}
                    className="w-full mt-4 border border-slate-200 rounded-xl px-4 py-3 h-40 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-3 mt-4">
                    <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => updateField('featured', e.target.checked)}
                    />

                    <span>Destaque</span>
                </div>

                <button
                    onClick={handleCreate}
                    className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                >
                    <Plus size={18} />
                    Criar Agente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                {agent.category}
                            </span>

                            {agent.featured && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                                    Destaque
                                </span>
                            )}
                        </div>

                        <h2 className="text-xl font-bold mb-2">
                            {agent.title}
                        </h2>

                        <p className="text-slate-500 text-sm mb-6">
                            {agent.description}
                        </p>

                        <button
                            onClick={() => handleDelete(agent.id)}
                            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl"
                        >
                            <Trash2 size={18} />
                            Excluir
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminAgents;