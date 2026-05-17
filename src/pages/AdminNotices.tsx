import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    Plus,
    Trash2,
    Star,
    Bell
} from 'lucide-react';

import { supabase } from '../lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
}

const AdminNotices: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        is_pinned: false,
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        setAnnouncements(data || []);
    };

    const createAnnouncement = async () => {
        if (!formData.title || !formData.content) {
            alert('Preencha todos os campos');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('announcements')
                .insert([
                    {
                        title: formData.title,
                        content: formData.content,
                        is_pinned: formData.is_pinned,
                    },
                ]);

            if (error) {
                console.error(error);
                alert('Erro ao criar aviso');
                return;
            }

            setFormData({
                title: '',
                content: '',
                is_pinned: false,
            });

            fetchAnnouncements();

            alert('Aviso publicado!');
        } catch (err) {
            console.error(err);
            alert('Erro inesperado');
        } finally {
            setLoading(false);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        const confirmDelete = window.confirm(
            'Deseja excluir este aviso?'
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            alert('Erro ao excluir');
            return;
        }

        fetchAnnouncements();
    };

    const togglePinned = async (
        id: string,
        current: boolean
    ) => {
        const { error } = await supabase
            .from('announcements')
            .update({
                is_pinned: !current,
            })
            .eq('id', id);

        if (error) {
            console.error(error);
            return;
        }

        fetchAnnouncements();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">
                    Gerenciar Avisos
                </h1>

                <p className="text-slate-500 mt-2">
                    Crie avisos e comunicados da plataforma.
                </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Plus className="text-blue-600" size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Novo Aviso
                        </h2>

                        <p className="text-sm text-slate-500">
                            Publique novidades para os alunos.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Título do aviso"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                title: e.target.value,
                            })
                        }
                        className="w-full h-14 px-5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                        placeholder="Conteúdo do aviso"
                        value={formData.content}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                content: e.target.value,
                            })
                        }
                        rows={5}
                        className="w-full p-5 rounded-2xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={formData.is_pinned}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    is_pinned: e.target.checked,
                                })
                            }
                            className="w-4 h-4"
                        />

                        Fixar aviso no topo
                    </label>

                    <button
                        onClick={createAnnouncement}
                        disabled={loading}
                        className="h-14 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold"
                    >
                        {loading ? 'Publicando...' : 'Publicar Aviso'}
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                {announcements.map((announcement, idx) => (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                                    <Bell className="text-blue-600" size={24} />
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black text-slate-900">
                                            {announcement.title}
                                        </h3>

                                        {announcement.is_pinned && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                                                Fixado
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-slate-500 leading-relaxed">
                                        {announcement.content}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-4">
                                        {new Date(
                                            announcement.created_at
                                        ).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() =>
                                        togglePinned(
                                            announcement.id,
                                            announcement.is_pinned
                                        )
                                    }
                                    className="w-12 h-12 rounded-2xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
                                >
                                    <Star
                                        className="text-amber-600"
                                        size={20}
                                    />
                                </button>

                                <button
                                    onClick={() =>
                                        deleteAnnouncement(announcement.id)
                                    }
                                    className="w-12 h-12 rounded-2xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                >
                                    <Trash2
                                        className="text-red-600"
                                        size={20}
                                    />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdminNotices;