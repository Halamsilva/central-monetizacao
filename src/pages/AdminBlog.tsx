import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
    Check,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Link2,
    Loader2,
    Pencil,
    Plus,
    Save,
    Trash2,
    Upload,
    Youtube,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

interface BlogPost {
    id: string;
    title: string;
    content: string;
    meta: string;
    image_url: string;
    youtube_url: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

const emptyForm = {
    title: '',
    content: '',
    meta: '',
    image_url: '',
    youtube_url: '',
    is_published: true,
};

const compressImage = (
    file: File,
    maxWidth = 1200,
    quality = 0.75
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxWidth / img.width);
                const width = Math.round(img.width * scale);
                const height = Math.round(img.height * scale);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas não suportado'));

                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Imagem inválida'));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
        reader.readAsDataURL(file);
    });
};

const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    useEffect(() => {
        loadPosts();
    }, []);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [message]);

    const loadPosts = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPosts(data || []);
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao carregar artigos.',
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
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImage(true);

            const dataUrl = await compressImage(file);
            updateField('image_url', dataUrl);

            setMessage({
                type: 'success',
                text: 'Imagem otimizada e adicionada.',
            });
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao processar a imagem. Tente outra.',
            });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const savePost = async () => {
        if (!formData.title.trim()) {
            setMessage({
                type: 'error',
                text: 'Digite o título do artigo.',
            });
            return;
        }

        if (!formData.content.trim()) {
            setMessage({
                type: 'error',
                text: 'Digite o conteúdo do artigo.',
            });
            return;
        }

        try {
            setSaving(true);

            const now = new Date().toISOString();

            const payload = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                meta: formData.meta.trim() || `Artigo do blog`,
                image_url: formData.image_url.trim() || null,
                youtube_url: formData.youtube_url.trim() || null,
                is_published: formData.is_published,
                updated_at: now,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('blog_posts')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: 'Artigo atualizado com sucesso.',
                });
            } else {
                const { error } = await supabase
                    .from('blog_posts')
                    .insert([
                        {
                            ...payload,
                            created_at: now,
                        },
                    ]);

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: 'Artigo criado com sucesso.',
                });
            }

            resetForm();
            await loadPosts();
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao salvar o artigo.',
            });
        } finally {
            setSaving(false);
        }
    };

    const editPost = (post: BlogPost) => {
        setEditingId(post.id);
        setFormData({
            title: post.title,
            content: post.content,
            meta: post.meta || '',
            image_url: post.image_url || '',
            youtube_url: post.youtube_url || '',
            is_published: post.is_published,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const togglePublish = async (post: BlogPost) => {
        try {
            const { error } = await supabase
                .from('blog_posts')
                .update({
                    is_published: !post.is_published,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', post.id);

            if (error) throw error;

            await loadPosts();
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao atualizar publicação.',
            });
        }
    };

    const deletePost = async (post: BlogPost) => {
        if (!window.confirm('Tem certeza que deseja excluir este artigo?')) {
            return;
        }

        try {
            setDeletingId(post.id);

            const { error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', post.id);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Artigo excluído.',
            });

            await loadPosts();
        } catch (err) {
            console.error(err);

            setMessage({
                type: 'error',
                text: 'Erro ao excluir o artigo.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
    const labelClass = 'mb-1 block text-sm font-semibold text-gray-700';

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Gerenciar Blog
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Crie e edite os artigos exibidos no blog público.
                </p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}
                >
                    {message.text}
                </motion.div>
            )}

            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {editingId ? 'Editar artigo' : 'Novo artigo'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Título *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Ex: Como Monetizar no Facebook em 2026"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Descrição curta (exibida sob o título)
                        </label>
                        <input
                            type="text"
                            value={formData.meta}
                            onChange={(e) => updateField('meta', e.target.value)}
                            placeholder="Ex: Publicado em 24 de setembro de 2026 | Leitura: 8 min"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1">
                                <ImageIcon className="h-4 w-4" /> Imagem do artigo
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="blog-image-file"
                            />
                            <label
                                htmlFor="blog-image-file"
                                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                                {uploadingImage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                {uploadingImage ? 'Otimizando...' : 'Enviar imagem'}
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                            A imagem é reduzida automaticamente para ~200KB. Ou cole
                            um link abaixo:
                        </p>
                        <input
                            type="text"
                            value={formData.image_url}
                            onChange={(e) =>
                                updateField('image_url', e.target.value)
                            }
                            placeholder="https://exemplo.com/imagem.jpg (ou envie acima)"
                            className={`${inputClass} mt-2`}
                        />
                        {formData.image_url && (
                            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                                <img
                                    src={formData.image_url}
                                    alt="Prévia"
                                    className="max-h-40 w-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display =
                                            'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1">
                                <Youtube className="h-4 w-4" /> Link do vídeo do YouTube
                            </span>
                        </label>
                        <input
                            type="text"
                            value={formData.youtube_url}
                            onChange={(e) =>
                                updateField('youtube_url', e.target.value)
                            }
                            placeholder="https://www.youtube.com/watch?v=XXXX (opcional)"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Conteúdo *</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) =>
                                updateField('content', e.target.value)
                            }
                            placeholder="Escreva o conteúdo do artigo aqui..."
                            rows={10}
                            className={`${inputClass} resize-y`}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Dica: cada parágrafo separado por linha em branco vira
                            um &lt;p&gt; no blog. Para link, use:{" "}
                            <code className="rounded bg-gray-100 px-1">
                                [texto](https://link.com)
                            </code>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) =>
                                updateField('is_published', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <label className="text-sm text-gray-700">
                            Publicado (aparece no blog público)
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={savePost}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {editingId ? 'Salvar alterações' : 'Criar artigo'}
                        </button>

                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancelar edição
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Artigos ({posts.length})
                    </h2>
                    <a
                        href="/blog.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <ExternalLink className="h-4 w-4" /> Ver blog
                    </a>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm text-gray-500">
                            Nenhum artigo ainda. Crie o primeiro acima!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                            >
                                <div className="min-w-0 flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="truncate font-semibold text-gray-900">
                                            {post.title}
                                        </h3>
                                        {post.is_published ? (
                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                Publicado
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                                Rascunho
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {new Date(
                                            post.created_at
                                        ).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => togglePublish(post)}
                                        title={
                                            post.is_published
                                                ? 'Despublicar'
                                                : 'Publicar'
                                        }
                                        className={`rounded-lg border p-2 transition ${
                                            post.is_published
                                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                                : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => editPost(post)}
                                        title="Editar"
                                        className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => deletePost(post)}
                                        disabled={deletingId === post.id}
                                        title="Excluir"
                                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deletingId === post.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBlog;