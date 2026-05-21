import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
    AlertTriangle,
    Bell,
    Check,
    ExternalLink,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Plus,
    Save,
    Star,
    Trash2,
    Upload,
    Link2,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    banner_url: string | null;
    link: string | null;
    is_pinned: boolean;
    is_highlighted: boolean;
    created_at: string;
}

const emptyForm = {
    title: '',
    content: '',
    thumbnail_url: '',
    banner_url: '',
    link: '',
    is_pinned: false,
    is_highlighted: false,
};

const normalizeLink = (link: string) => {
    const cleanLink = link.trim();

    if (!cleanLink) return null;

    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
        return cleanLink;
    }

    return `https://${cleanLink}`;
};

const AdminNotices: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [message]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAnnouncements(data || []);
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao carregar avisos.',
            });
        } finally {
            setLoading(false);
        }
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
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        if (bannerInputRef.current) bannerInputRef.current.value = '';
    };

    const uploadImage = async (file: File, type: 'thumbnail' | 'banner') => {
        try {
            if (type === 'thumbnail') {
                setUploadingThumbnail(true);
            } else {
                setUploadingBanner(true);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${type}-${Date.now()}.${fileExt}`;
            const filePath = `announcements/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            if (type === 'thumbnail') {
                updateField('thumbnail_url', data.publicUrl);
            } else {
                updateField('banner_url', data.publicUrl);
            }

            setMessage({
                type: 'success',
                text: 'Imagem enviada com sucesso.',
            });
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao enviar arquivo. Você também pode colar o link direto da imagem no campo de texto abaixo.',
            });
        } finally {
            setUploadingThumbnail(false);
            setUploadingBanner(false);
        }
    };

    const saveAnnouncement = async () => {
        if (!formData.title.trim()) {
            setMessage({
                type: 'error',
                text: 'Digite o título do aviso.',
            });
            return;
        }

        if (!formData.content.trim()) {
            setMessage({
                type: 'error',
                text: 'Digite o conteúdo do aviso.',
            });
            return;
        }

        try {
            setSaving(true);

            const payload = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                thumbnail_url: formData.thumbnail_url.trim() || null,
                banner_url: formData.banner_url.trim() || null,
                link: normalizeLink(formData.link),
                is_pinned: formData.is_pinned,
                is_highlighted: formData.is_highlighted,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('announcements')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: 'Aviso atualizado com sucesso.',
                });
            } else {
                const { error } = await supabase
                    .from('announcements')
                    .insert([payload]);

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: 'Aviso criado com sucesso.',
                });
            }

            resetForm();
            await loadAnnouncements();
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao salvar aviso. Verifique se a coluna link existe no Supabase.',
            });
        } finally {
            setSaving(false);
        }
    };

    const editAnnouncement = (announcement: Announcement) => {
        setEditingId(announcement.id);

        setFormData({
            title: announcement.title || '',
            content: announcement.content || '',
            thumbnail_url: announcement.thumbnail_url || '',
            banner_url: announcement.banner_url || '',
            link: announcement.link || '',
            is_pinned: announcement.is_pinned || false,
            is_highlighted: announcement.is_highlighted || false,
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const deleteAnnouncement = async (announcement: Announcement) => {
        const confirmDelete = confirm(
            `Tem certeza que deseja excluir "${announcement.title}"?`
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(announcement.id);

            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcement.id);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Aviso excluído com sucesso.',
            });

            await loadAnnouncements();
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao excluir aviso.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-4">
            <div>
                <h1 className="text-4xl font-black text-slate-900">
                    Gerenciar Avisos
                </h1>

                <p className="mt-2 text-lg text-slate-500">
                    Crie avisos com thumbnail, banner, destaque visual premium e link clicável.
                </p>
            </div>

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

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                            <Plus size={26} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-slate-900">
                                {editingId ? 'Editar Aviso' : 'Novo Aviso'}
                            </h2>

                            <p className="text-sm text-slate-500">
                                Comunicação oficial da plataforma.
                            </p>
                        </div>
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

                <div className="space-y-4">
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(event) => updateField('title', event.target.value)}
                        placeholder="Título do aviso"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />

                    <textarea
                        value={formData.content}
                        onChange={(event) => updateField('content', event.target.value)}
                        placeholder="Conteúdo do aviso"
                        className="min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base font-medium leading-relaxed outline-none transition focus:border-blue-500 focus:bg-white"
                    />

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                            Link clicável do aviso (Opcional)
                        </label>
                        <input
                            type="url"
                            value={formData.link}
                            onChange={(event) => updateField('link', event.target.value)}
                            placeholder="https://exemplo.com"
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base font-semibold outline-none transition focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* SEÇÃO DA THUMBNAIL MISTA (UPLOAD + CAMPO DE LINK) */}
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 space-y-3">
                            <label className="flex items-center gap-2 text-base font-black text-slate-800">
                                <ImageIcon size={20} />
                                Thumbnail
                            </label>

                            <label className="flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100">
                                {uploadingThumbnail ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Upload size={18} />
                                )}
                                Selecionar arquivo de thumbnail
                                <input
                                    ref={thumbnailInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingThumbnail}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) uploadImage(file, 'thumbnail');
                                    }}
                                />
                            </label>

                            <div className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Link2 size={12} /> Ou cole a URL da Thumbnail direto:
                                </label>
                                <input
                                    type="text"
                                    value={formData.thumbnail_url}
                                    onChange={e => updateField('thumbnail_url', e.target.value)}
                                    placeholder="https://linkdaimagem.com/foto.jpg"
                                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-500 bg-slate-50/50"
                                />
                            </div>

                            {formData.thumbnail_url && (
                                <div className="relative mt-4">
                                    <img
                                        src={formData.thumbnail_url}
                                        alt="Thumbnail"
                                        className="h-36 w-full rounded-2xl object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateField('thumbnail_url', '')}
                                        className="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white shadow-md hover:bg-red-700 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SEÇÃO DO BANNER MISTO (UPLOAD + CAMPO DE LINK) */}
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 space-y-3">
                            <label className="flex items-center gap-2 text-base font-black text-slate-800">
                                <ImageIcon size={20} />
                                Banner
                            </label>

                            <label className="flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100">
                                {uploadingBanner ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Upload size={18} />
                                )}
                                Selecionar arquivo de banner
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingBanner}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) uploadImage(file, 'banner');
                                    }}
                                />
                            </label>

                            <div className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Link2 size={12} /> Ou cole a URL do Banner direto:
                                </label>
                                <input
                                    type="text"
                                    value={formData.banner_url}
                                    onChange={e => updateField('banner_url', e.target.value)}
                                    placeholder="https://linkdaimagem.com/banner.jpg"
                                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-500 bg-slate-50/50"
                                />
                            </div>

                            {formData.banner_url && (
                                <div className="relative mt-4">
                                    <img
                                        src={formData.banner_url}
                                        alt="Banner"
                                        className="h-36 w-full rounded-2xl object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateField('banner_url', '')}
                                        className="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white shadow-md hover:bg-red-700 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.is_pinned}
                                onChange={(event) =>
                                    updateField('is_pinned', event.target.checked)
                                }
                            />
                            Fixar aviso no topo
                        </label>

                        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.is_highlighted}
                                onChange={(event) =>
                                    updateField('is_highlighted', event.target.checked)
                                }
                            />
                            Destacar visualmente
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={saveAnnouncement}
                        disabled={saving || uploadingThumbnail || uploadingBanner}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {editingId ? 'Salvar Alterações' : 'Publicar Aviso'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-2xl font-black text-slate-900">
                    Avisos cadastrados
                </h2>

                {loading ? (
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <Loader2 className="animate-spin text-blue-600" size={20} />
                        Carregando avisos...
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                        <Bell size={40} className="mx-auto mb-3 text-slate-300" />

                        <p className="font-bold text-slate-500">
                            Nenhum aviso cadastrado.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-blue-600">
                                        {announcement.thumbnail_url ? (
                                            <img
                                                src={announcement.thumbnail_url}
                                                alt={announcement.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Bell size={28} />
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            {announcement.is_pinned && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                                                    <Star size={12} />
                                                    Fixado
                                                </span>
                                            )}

                                            {announcement.is_highlighted && (
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                                                    Destaque
                                                </span>
                                            )}

                                            {announcement.link && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                                                    <ExternalLink size={12} />
                                                    Link ativo
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mt-2 text-lg font-black text-slate-900">
                                            {announcement.title}
                                        </h3>

                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                            {announcement.content}
                                        </p>

                                        {announcement.link && (
                                            <a
                                                href={announcement.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-sm font-black text-blue-600 transition hover:text-blue-700"
                                            >
                                                <ExternalLink size={15} />
                                                Abrir link do aviso
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => editAnnouncement(announcement)}
                                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-black text-white transition hover:bg-amber-600"
                                    >
                                        <Pencil size={16} />
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => deleteAnnouncement(announcement)}
                                        disabled={deletingId === announcement.id}
                                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-70"
                                    >
                                        {deletingId === announcement.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNotices;
