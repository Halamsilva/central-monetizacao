import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Loader2, PlayCircle, Plus, Trash2, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  video_url: '',
  category: 'Comece aqui',
};

const normalizeUrl = (url: string) => {
  const clean = url.trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `https://${clean}`;
};

const getEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(normalizeUrl(url));

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.includes('/shorts/')) {
        const shortId = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
      }
    }

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return '';
  }

  return '';
};

const Tutorials: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [setupMissing, setSetupMissing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTutorials();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSetupMissing(false);
      setTutorials((data || []) as Tutorial[]);
    } catch (error: any) {
      const isMissingTable = /tutorials|schema cache|Could not find the table/i.test(error.message || '');
      setSetupMissing(isMissingTable);
      if (!isMissingTable) {
        setMessage({ type: 'error', text: 'Erro ao carregar tutoriais.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const saveTutorial = async () => {
    if (setupMissing) {
      setMessage({ type: 'error', text: 'Crie a tabela de tutoriais no Supabase antes de publicar.' });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.video_url.trim()) {
      setMessage({ type: 'error', text: 'Preencha titulo, descricao e link do video.' });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('tutorials').insert([
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          video_url: normalizeUrl(formData.video_url),
          category: formData.category.trim() || 'Tutorial',
          is_published: true,
        },
      ]);

      if (error) throw error;
      setFormData(emptyForm);
      setMessage({ type: 'success', text: 'Tutorial publicado para os alunos.' });
      await loadTutorials();
    } catch (error: any) {
      const isMissingTable = /tutorials|schema cache|Could not find the table/i.test(error.message || '');
      setSetupMissing(isMissingTable);
      setMessage({
        type: 'error',
        text: isMissingTable ? 'Crie a tabela de tutoriais no Supabase antes de publicar.' : 'Erro ao salvar tutorial.',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTutorial = async (id: string) => {
    if (!window.confirm('Deseja remover este tutorial?')) return;

    try {
      setDeletingId(id);
      const { error } = await supabase.from('tutorials').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Tutorial removido.' });
      await loadTutorials();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao remover tutorial.' });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4 sm:space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              <PlayCircle size={14} />
              Aulas rapidas
            </div>
            <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Tutoriais</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
              Videos curtos mostrando como usar as ferramentas da plataforma.
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className={`rounded-2xl p-4 text-sm font-bold text-white ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {setupMissing && (
        <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-amber-950">Configuração pendente no Supabase</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800">
            A aba ja esta criada, mas falta rodar o arquivo <span className="font-black">supabase-tutorials.sql</span> no SQL Editor do Supabase para salvar os videos.
          </p>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-[24px] border border-blue-200 bg-blue-50/30 p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            <h2 className="text-xl font-black text-slate-950">Adicionar tutorial</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Titulo</span>
              <input value={formData.title} onChange={(event) => updateField('title', event.target.value)} className="field" placeholder="Como usar o editor em massa" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Categoria</span>
              <input value={formData.category} onChange={(event) => updateField('category', event.target.value)} className="field" placeholder="Editor em massa" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Link do video</span>
              <input value={formData.video_url} onChange={(event) => updateField('video_url', event.target.value)} className="field" placeholder="YouTube, Vimeo ou link direto" />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Descricao</span>
            <input value={formData.description} onChange={(event) => updateField('description', event.target.value)} className="field" placeholder="Explique o que o aluno vai aprender neste video" />
          </label>

          <button
            type="button"
            onClick={saveTutorial}
            disabled={saving || setupMissing}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {saving ? 'Publicando...' : 'Publicar tutorial'}
          </button>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-slate-200 bg-white p-12 text-sm font-bold text-slate-500">
          <Loader2 className="mr-2 animate-spin text-blue-600" size={20} />
          Carregando tutoriais...
        </div>
      ) : tutorials.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <Video className="mx-auto mb-3 text-blue-600" size={36} />
          <h3 className="text-lg font-black text-slate-950">Nenhum tutorial cadastrado</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Os videos aparecem aqui quando forem publicados.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tutorials.map((tutorial, index) => {
            const embedUrl = getEmbedUrl(tutorial.video_url);

            return (
              <motion.article
                key={tutorial.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-video bg-slate-100">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteTutorial(tutorial.id)}
                      disabled={deletingId === tutorial.id}
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
                    >
                      {deletingId === tutorial.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={tutorial.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={tutorial.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full items-center justify-center gap-2 text-sm font-black text-blue-700"
                    >
                      <ExternalLink size={18} />
                      Abrir video
                    </a>
                  )}
                </div>
                <div className="p-5">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                    {tutorial.category}
                  </span>
                  <h2 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{tutorial.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-relaxed text-slate-500">{tutorial.description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tutorials;
