import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Workflow,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';
import { fileToCompressedDataUrl } from '../../lib/image';
import { useAuth } from '../../context/AuthContext';

type FlowCard = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link: string;
  created_at?: string;
};

const callAgent = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';

  const response = await fetch('/api/agents/flow-automations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(await describeHttpError(response, 'Nao consegui falar com as automacoes.'));
  }

  return response.json();
};

const FlowAutomations: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<FlowCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await callAgent('list');
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      setError(err?.message || 'Nao consegui carregar as automacoes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setTitle('');
    setDescription('');
    setLink('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (item: FlowCard) => {
    setEditingId(item.id);
    setShowForm(true);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setLink(item.link || '');
    setImageUrl(item.image_url || '');
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const compressed = await fileToCompressedDataUrl(file, 900, 0.72);
      setImageUrl(compressed);
      setMessage({ type: 'success', text: 'Imagem carregada! Ela sera salva junto com o card.' });
    } catch {
      setMessage({ type: 'error', text: 'Nao consegui ler a imagem. Tente outro arquivo (JPG ou PNG).' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Informe o titulo do card.' });
      return;
    }

    if (!link.trim()) {
      setMessage({ type: 'error', text: 'Informe o link que o aluno vai abrir ao clicar.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await callAgent('save', {
        id: editingId || undefined,
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        imageUrl,
      });

      setMessage({
        type: 'success',
        text: editingId ? 'Card atualizado com sucesso!' : 'Card adicionado com sucesso!',
      });

      resetForm();
      loadItems();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Nao consegui salvar o card.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: FlowCard) => {
    const confirmed = window.confirm(`Remover o card "${item.title}"?`);
    if (!confirmed) return;

    try {
      await callAgent('delete', { id: item.id });
      setMessage({ type: 'success', text: 'Card removido.' });
      if (editingId === item.id) resetForm();
      loadItems();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Nao consegui remover o card.' });
    }
  };

  return (
    <div className="min-h-[80vh] overflow-hidden rounded-3xl bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <Workflow size={22} />
            </span>
            <div>
              <h1 className="text-lg font-black tracking-tight sm:text-xl">Automações do FLOW</h1>
              <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">
                Materiais, templates e automações prontas — clique no card para acessar
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                  setEditingId(null);
                  setMessage(null);
                }
              }}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-black text-black transition hover:brightness-110"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Fechar' : 'Adicionar card'}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario do admin */}
        {isAdmin && showForm && (
          <section className="rounded-3xl border border-orange-500/30 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-orange-300">
                {editingId ? 'Editar card' : 'Novo card'}
              </h2>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Título *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex: Automação de legendas no Flow"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Uma frase explicando o que o aluno vai encontrar."
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm font-medium leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Link de destino *
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Imagem do card</label>

                  <div className="mt-2 flex flex-col gap-2">
                    <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-500/40 bg-orange-500/5 px-4 text-xs font-black text-orange-300 transition hover:bg-orange-500/10">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploading ? 'Carregando imagem...' : 'Enviar imagem do computador'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleUpload(file);
                        }}
                      />
                    </label>

                    <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      ou
                    </span>

                    <input
                      type="text"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="Cole a URL de uma imagem (https://...)"
                      className="h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>

                  <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">
                    A imagem enviada do computador é comprimida e salva junto com o card. Se preferir, use uma URL de
                    imagem hospedada em outro lugar.
                  </p>

                  {imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                      <img src={imageUrl} alt="Previa" className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-800 py-2 text-[11px] font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={12} /> Remover imagem
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                {editingId ? 'Salvar alterações' : 'Adicionar card'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-700 px-5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {/* Lista de cards */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-400">
            <Loader2 size={18} className="animate-spin" /> Carregando automações...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <ImagePlus size={26} />
            </span>
            <p className="mt-4 text-sm font-black text-slate-200">Nenhuma automação publicada ainda</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isAdmin
                ? 'Clique em "Adicionar card" para publicar a primeira.'
                : 'Em breve novidades por aqui. Fica de olho!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 transition hover:-translate-y-0.5 hover:border-orange-500/40"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-950 text-orange-400">
                        <Workflow size={34} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-sm font-black leading-snug text-slate-100">{item.title}</p>

                    {item.description && (
                      <p className="mt-1.5 line-clamp-3 flex-1 text-xs font-medium leading-relaxed text-slate-400">
                        {item.description}
                      </p>
                    )}

                    <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-orange-300">
                      Acessar <ExternalLink size={12} />
                    </span>
                  </div>
                </a>

                {isAdmin && (
                  <div className="flex border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 border-l border-slate-800 py-2.5 text-[11px] font-bold text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 underline transition hover:text-slate-300 disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar lista
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowAutomations;
