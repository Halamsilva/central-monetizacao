import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    Plus,
    Trash2,
    Star,
    Bell,
    Pencil,
    Save,
    X,
    Upload,
    Image,
    Sparkles,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    is_highlighted: boolean;
    thumbnail_url: string | null;
    banner_url: string | null;
    created_at: string;
}

const BUCKET_NAME = 'announcement-images';

const AdminNotices: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        is_pinned: false,
        is_highlighted: false,
        thumbnail_url: '',
        banner_url: '',
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
            alert('Erro ao carregar avisos.');
            return;
        }

        setAnnouncements(data || []);
    };

    const uploadImage = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error(error);
            throw new Error('Erro ao enviar imagem.');
        }

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            is_pinned: false,
            is_highlighted: false,
            thumbnail_url: '',
            banner_url: '',
        });

        setThumbnailFile(null);
        setBannerFile(null);
        setEditingId(null);
    };

    const createAnnouncement = async () => {
        if (!formData.title || !formData.content) {
            alert('Preencha título e conteúdo.');
            return;
        }

        try {
            setLoading(true);

            let thumbnailUrl = formData.thumbnail_url;
            let bannerUrl = formData.banner_url;

            if (thumbnailFile) {
                thumbnailUrl = await uploadImage(thumbnailFile, 'thumbnails');
            }

            if (bannerFile) {
                bannerUrl = await uploadImage(bannerFile, 'banners');
            }

            const { error } = await supabase.from('announcements').insert([
                {
                    title: formData.title,
                    content: formData.content,
                    is_pinned: formData.is_pinned,
                    is_highlighted: formData.is_highlighted,
                    thumbnail_url: thumbnailUrl || null,
                    banner_url: bannerUrl || null,
                },
            ]);

            if (error) {
                console.error(error);
                alert('Erro ao criar aviso.');
                return;
            }

            resetForm();
            await fetchAnnouncements();

            alert('Aviso publicado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar imagem ou criar aviso.');
        } finally {
            setLoading(false);
        }
    };

    const updateAnnouncement = async () => {
        if (!editingId) return;

        if (!formData.title || !formData.content) {
            alert('Preencha título e conteúdo.');
            return;
        }

        try {
            setLoading(true);

            let thumbnailUrl = formData.thumbnail_url;
            let bannerUrl = formData.banner_url;

            if (thumbnailFile) {
                thumbnailUrl = await uploadImage(thumbnailFile, 'thumbnails');
            }

            if (bannerFile) {
                bannerUrl = await uploadImage(bannerFile, 'banners');
            }

            const { error } = await supabase
                .from('announcements')
                .update({
                    title: formData.title,
                    content: formData.content,
                    is_pinned: formData.is_pinned,
                    is_highlighted: formData.is_highlighted,
                    thumbnail_url: thumbnailUrl || null,
                    banner_url: bannerUrl || null,
                })
                .eq('id', editingId);

            if (error) {
                console.error(error);
                alert('Erro ao atualizar aviso.');
                return;
            }

            resetForm();
            await fetchAnnouncements();

            alert('Aviso atualizado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar imagem ou atualizar aviso.');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);

        setFormData({
            title: announcement.title,
            content: announcement.content,
            is_pinned: announcement.is_pinned,
            is_highlighted: announcement.is_highlighted || false,
            thumbnail_url: announcement.thumbnail_url || '',
            banner_url: announcement.banner_url || '',
        });

        setThumbnailFile(null);
        setBannerFile(null);

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const deleteAnnouncement = async (id: string) => {
        const confirmDelete = window.confirm(
            'Tem certeza que deseja excluir este aviso?'
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            alert('Erro ao excluir aviso.');
            return;
        }

        await fetchAnnouncements();

        alert('Aviso excluído com sucesso!');
    };

    const togglePinned = async (id: string, currentValue: boolean) => {
        const { error } = await supabase
            .from('announcements')
            .update({
                is_pinned: !currentValue,
            })
            .eq('id', id);

        if (error) {
            console.error(error);
            alert('Erro ao alterar fixação.');
            return;
        }

        await fetchAnnouncements();
    };

    const toggleHighlighted = async (id: string, currentValue: boolean) => {
        const { error } = await supabase
            .from('announcements')
            .update({
                is_highlighted: !currentValue,
            })
            .eq('id', id);

        if (error) {
            console.error(error);
            alert('Erro ao alterar destaque.');
            return;
        }

        await fetchAnnouncements();
    };

    const thumbnailPreview = thumbnailFile
        ? URL.createObjectURL(thumbnailFile)
        : formData.thumbnail_url;

    const bannerPreview = bannerFile
        ? URL.createObjectURL(bannerFile)
        : formData.banner_url;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">
                    Gerenciar Avisos
                </h1>

                <p className="mt-2 text-slate-500">
                    Crie avisos com thumbnail, banner e destaque visual premium.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                        {editingId ? (
                            <Pencil className="text-blue-600" size={22} />
                        ) : (
                            <Plus className="text-blue-600" size={22} />
                        )}
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {editingId ? 'Editar Aviso' : 'Novo Aviso'}
                        </h2>

                        <p className="text-sm text-slate-500">
                            Comunicação oficial da plataforma.
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    <input
                        type="text"
                        placeholder="Título do aviso"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                        placeholder="Conteúdo do aviso"
                        value={formData.content}
                        onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                        }
                        rows={5}
                        className="w-full resize-none rounded-2xl border border-slate-200 p-5 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <div className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                                <Image size={18} />
                                Thumbnail
                            </div>

                            {thumbnailPreview && (
                                <img
                                    src={thumbnailPreview}
                                    alt="Preview da thumbnail"
                                    className="mb-4 h-32 w-full rounded-2xl object-cover"
                                />
                            )}

                            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-bold text-slate-700 shadow-sm transition hover:bg-slate-100">
                                <Upload size={18} />
                                Selecionar thumbnail
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setThumbnailFile(e.target.files?.[0] || null)
                                    }
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <div className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                                <Image size={18} />
                                Banner
                            </div>

                            {bannerPreview && (
                                <img
                                    src={bannerPreview}
                                    alt="Preview do banner"
                                    className="mb-4 h-32 w-full rounded-2xl object-cover"
                                />
                            )}

                            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-bold text-slate-700 shadow-sm transition hover:bg-slate-100">
                                <Upload size={18} />
                                Selecionar banner
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setBannerFile(e.target.files?.[0] || null)
                                    }
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-5">
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.is_pinned}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_pinned: e.target.checked,
                                    })
                                }
                                className="h-4 w-4"
                            />
                            Fixar aviso no topo
                        </label>

                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.is_highlighted}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_highlighted: e.target.checked,
                                    })
                                }
                                className="h-4 w-4"
                            />
                            Destacar visualmente
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={editingId ? updateAnnouncement : createAnnouncement}
                            disabled={loading}
                            className="flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            {editingId ? (
                                <>
                                    <Save size={18} />
                                    Salvar Alterações
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Publicar Aviso
                                </>
                            )}
                        </button>

                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="flex h-14 items-center gap-2 rounded-2xl bg-slate-200 px-6 font-bold text-slate-700 transition hover:bg-slate-300"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {announcements.map((announcement, index) => (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                    >
                        {announcement.banner_url && (
                            <img
                                src={announcement.banner_url}
                                alt={announcement.title}
                                className="h-44 w-full object-cover"
                            />
                        )}

                        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100">
                                    {announcement.thumbnail_url ? (
                                        <img
                                            src={announcement.thumbnail_url}
                                            alt={announcement.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Bell className="text-blue-600" size={24} />
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        <h3 className="text-xl font-black text-slate-900">
                                            {announcement.title}
                                        </h3>

                                        {announcement.is_pinned && (
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-700">
                                                Fixado
                                            </span>
                                        )}

                                        {announcement.is_highlighted && (
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase text-blue-700">
                                                Destaque
                                            </span>
                                        )}
                                    </div>

                                    <p className="whitespace-pre-line leading-relaxed text-slate-500">
                                        {announcement.content}
                                    </p>

                                    <p className="mt-4 text-xs text-slate-400">
                                        {new Date(announcement.created_at).toLocaleDateString(
                                            'pt-BR'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => startEdit(announcement)}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition hover:bg-slate-200"
                                >
                                    <Pencil className="text-slate-700" size={20} />
                                </button>

                                <button
                                    onClick={() =>
                                        togglePinned(announcement.id, announcement.is_pinned)
                                    }
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 transition hover:bg-amber-200"
                                >
                                    <Star className="text-amber-600" size={20} />
                                </button>

                                <button
                                    onClick={() =>
                                        toggleHighlighted(
                                            announcement.id,
                                            announcement.is_highlighted
                                        )
                                    }
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 transition hover:bg-blue-200"
                                >
                                    <Sparkles className="text-blue-600" size={20} />
                                </button>

                                <button
                                    onClick={() => deleteAnnouncement(announcement.id)}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 transition hover:bg-red-200"
                                >
                                    <Trash2 className="text-red-600" size={20} />
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