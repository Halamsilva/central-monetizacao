import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
    ShoppingBag,
    Plus,
    Trash2,
    Loader2,
    Check,
    ExternalLink,
    Search,
    DollarSign,
    Pencil,
    X
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProductItem {
    id: string;
    title: string;
    description: string;
    price: string;
    image_url: string | null;
    checkout_url: string;
    button_text: string;
    is_active: boolean;
    created_at: string;
}

const draftKey = 'shop_page_draft';

const emptyForm = {
    title: '',
    description: '',
    price: '',
    image_url: '',
    checkout_url: '',
    button_text: 'QUER COMPRAR',
    is_active: true
};

const getInitialForm = () => {
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return emptyForm;
    try {
        return JSON.parse(savedDraft);
    } catch {
        return emptyForm;
    }
};

const ShopVIP: React.FC = () => {
    const { isAdmin } = useAuth();

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [formData, setFormData] = useState(getInitialForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 3500);
        return () => clearTimeout(timer);
    }, [message]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('shop_products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao carregar a loja.' });
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: keyof typeof emptyForm, value: string | boolean) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        localStorage.removeItem(draftKey);
    };

    const handleEdit = (product: ProductItem) => {
        setEditingId(product.id);
        setFormData({
            title: product.title || '',
            description: product.description || '',
            price: product.price || '',
            image_url: product.image_url || '',
            checkout_url: product.checkout_url || '',
            button_text: product.button_text || 'QUER COMPRAR',
            is_active: product.is_active
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveProduct = async () => {
        if (!formData.title.trim() || !formData.price.trim() || !formData.checkout_url.trim()) {
            setMessage({ type: 'error', text: 'Preencha os campos obrigatórios (*).' });
            return;
        }

        try {
            setSaving(true);

            // Garante que o preço sempre tenha o "R$" bonitinho se o usuário esquecer
            let formattedPrice = formData.price.trim();
            if (!formattedPrice.startsWith('R$') && !formattedPrice.toLowerCase().includes('grátis')) {
                formattedPrice = `R$ ${formattedPrice}`;
            }

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: formattedPrice,
                image_url: formData.image_url.trim() || null,
                checkout_url: formData.checkout_url.trim(),
                button_text: formData.button_text.trim() || 'QUER COMPRAR',
                is_active: formData.is_active
            };

            if (editingId) {
                const { error } = await supabase
                    .from('shop_products')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;
                setMessage({ type: 'success', text: 'Produto atualizado com sucesso!' });
            } else {
                const { error } = await supabase
                    .from('shop_products')
                    .insert([payload]);

                if (error) throw error;

                // Notificação automática com som para os alunos
                await supabase
                    .from('notifications')
                    .insert([
                        {
                            title: `💎 Nova Oferta VIP Liberada!`,
                            message: `O item "${payload.title}" foi adicionado na Loja VIP por apenas ${payload.price}. Aproveite!`,
                            type: 'facebook'
                        }
                    ]);

                setMessage({ type: 'success', text: 'Produto publicado e alunos notificados!' });
            }

            resetForm();
            await loadProducts();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar produto.' });
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!window.confirm('Deseja mesmo remover este produto da vitrine permanentemente?')) return;
        try {
            const { error } = await supabase
                .from('shop_products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Produto removido com sucesso da loja!' });
            await loadProducts();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao deletar produto do banco.' });
        }
    };

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter(p => !term || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    }, [products, search]);

    const hasDraft = formData.title || formData.price || formData.checkout_url || formData.description;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />
                <p className="text-slate-500 font-bold">Carregando Vitrine VIP...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-4">
            {/* Banner Superior */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-10 text-white shadow-xl shadow-blue-100/10"
            >
                <div className="relative z-10 max-w-3xl">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                        <ShoppingBag size={28} />
                    </div>
                    <h1 className="text-4xl font-black">Loja VIP & Ferramentas</h1>
                    <p className="mt-3 text-xl font-bold text-blue-400">Acessos exclusivos e ferramentas premium</p>
                </div>
            </motion.div>

            {/* FORMULÁRIO DO ADMIN */}
            {isAdmin && (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900">
                            {editingId ? 'Editar Produto / Acesso' : 'Cadastrar Produto / Acesso'}
                        </h2>
                        <div className="flex items-center gap-2">
                            {hasDraft && (
                                <button onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200">
                                    <X size={12} /> Cancelar
                                </button>
                            )}
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Rascunho protegido</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500">Título do Produto *</label>
                            <input type="text" value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="Ex: Acesso Vitalício Pack Prompts" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500">Preço *</label>
                            <input type="text" value={formData.price} onChange={e => updateField('price', e.target.value)} placeholder="Ex: 47,00" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500">Texto do Botão</label>
                            <input type="text" value={formData.button_text} onChange={e => updateField('button_text', e.target.value)} placeholder="Ex: COMPRAR" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-3">
                            <label className="text-[10px] font-black uppercase text-slate-500">Link de Checkout (Kiwify/Perfect Pay) *</label>
                            <input type="text" value={formData.checkout_url} onChange={e => updateField('checkout_url', e.target.value)} placeholder="https://pay.kiwify.com/..." className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-3">
                            <label className="text-[10px] font-black uppercase text-slate-500">URL da imagem da capa (Opcional)</label>
                            <input type="text" value={formData.image_url} onChange={e => updateField('image_url', e.target.value)} placeholder="https://...imagem.jpg" className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Descrição das Vantagens</label>
                        <textarea value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Digite os benefícios do produto aqui..." className="w-full min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium outline-none focus:border-blue-500" />
                    </div>

                    <button onClick={saveProduct} disabled={saving} className="w-full h-12 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md">
                        {saving && <Loader2 className="animate-spin" size={16} />}
                        {saving ? 'Salvando...' : editingId ? 'Salvar Alterações do Produto' : 'Liberar Produto na Vitrine'}
                    </button>
                </div>
            )}

            {/* Alerta de Feedback */}
            {message && (
                <div className={`p-4 rounded-xl font-bold text-white text-sm ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Filtro de Busca */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos na loja..." className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-500 transition shadow-xs" />
            </div>

            {/* Grid de Vendas */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-1 transition duration-300 hover:shadow-md">

                        {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="h-44 w-full rounded-2xl object-cover mb-4" />
                        ) : (
                            <div className="h-44 w-full rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                                <ShoppingBag size={48} />
                            </div>
                        )}

                        <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-lg font-black leading-tight text-slate-900 line-clamp-2">{product.title}</h3>
                                <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-black text-blue-600">{product.price}</span>
                            </div>

                            <p className="text-sm font-medium text-slate-500 line-clamp-3 mb-5 leading-relaxed">{product.description || 'Sem descrição cadastrada.'}</p>

                            {/* MÁGICA: Botão de comprar agora verde esmeralda profissional */}
                            <a href={product.checkout_url} target="_blank" rel="noreferrer" className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 transition shadow-sm">
                                <DollarSign size={14} /> {product.button_text}
                            </a>
                        </div>

                        {/* Painel Flutuante de Ações (Apenas Admin) */}
                        {isAdmin && (
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <button onClick={() => handleEdit(product)} className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition" title="Editar">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => deleteProduct(product.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm hover:bg-rose-600 transition" title="Excluir">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShopVIP;
