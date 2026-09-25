import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Lock, PlayCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const AIAccounts: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [opening, setOpening] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [adminLink, setAdminLink] = useState('');
  const [adminVideoLink, setAdminVideoLink] = useState('');
  const [protectedVideoUrl, setProtectedVideoUrl] = useState('');
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasAccess = isAdmin || accessAllowed;

  useEffect(() => {
    const loadAccess = async () => {
      if (isAdmin) {
        setAccessAllowed(true);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
          setAccessAllowed(false);
          return;
        }

        const response = await fetch('/api/ai-accounts-access?content=1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => ({}));
        const allowed = response.ok && result.allowed === true;
        setAccessAllowed(allowed);
        setProtectedVideoUrl(allowed ? result.videoUrl || '' : '');
      } catch {
        setAccessAllowed(false);
      }
    };

    loadAccess();
  }, [isAdmin, profile?.id]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!isAdmin) return;

      setLoadingSettings(true);

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) return;

        const response = await fetch('/api/admin/ai-accounts-settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          setAdminLink(result.url || '');
          setAdminVideoLink(result.videoUrl || '');
          setProtectedVideoUrl(result.videoUrl || '');
        }
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [isAdmin]);

  const saveAdminLink = async () => {
    setSavingSettings(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para salvar.');
      }

      const response = await fetch('/api/admin/ai-accounts-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: adminLink, videoUrl: adminVideoLink }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Nao foi possivel salvar o link.');
      }

      setProtectedVideoUrl(adminVideoLink);
      setSuccess('Links salvos. O botao e o video ja ficam liberados para os alunos aprovados.');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel salvar o link.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return '';

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes('youtube.com')) {
        const videoId = parsedUrl.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }

      if (parsedUrl.hostname.includes('youtu.be')) {
        const videoId = parsedUrl.pathname.replace('/', '');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }

      if (parsedUrl.hostname.includes('vimeo.com')) {
        const videoId = parsedUrl.pathname.split('/').filter(Boolean).pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
      }
    } catch {
      return url;
    }

    return url;
  };

  const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  const openProtectedLink = async () => {
    setOpening(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para abrir.');
      }

      const response = await fetch('/api/ai-accounts-link', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Nao foi possivel abrir agora.');
      }

      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel abrir agora.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <Sparkles size={26} />
            </div>

            <div>
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Acesso extra
              </span>
              <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">
                CONTAS DE IA ilimitado
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-300 sm:text-base">
                Area separada para alunos que compraram esse acesso. O botao libera o destino sem deixar o link fixo na tela.
              </p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
            hasAccess
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
          }`}>
            {hasAccess ? <ShieldCheck size={18} /> : <Lock size={18} />}
            {hasAccess ? 'Liberado' : 'Bloqueado'}
          </div>
        </div>
      </motion.section>

      {isAdmin && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.25em] text-violet-700 dark:text-violet-300">
                  Link do botao
                </label>
                <input
                  type="url"
                  value={adminLink}
                  onChange={(event) => setAdminLink(event.target.value)}
                  placeholder="Cole aqui o link privado do Canva Pro"
                  className="mt-3 h-12 w-full rounded-2xl border border-violet-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-black dark:text-white dark:focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.25em] text-violet-700 dark:text-violet-300">
                  Video de explicacao
                </label>
                <input
                  type="url"
                  value={adminVideoLink}
                  onChange={(event) => setAdminVideoLink(event.target.value)}
                  placeholder="Cole link do YouTube nao listado (recomendado)"
                  className="mt-3 h-12 w-full rounded-2xl border border-violet-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-black dark:text-white dark:focus:ring-violet-500/20"
                />
                <p className="mt-2 text-xs font-semibold text-violet-700/70 dark:text-violet-200/70">
                  Use YouTube nao listado para tocar o video sem gastar banda.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs font-semibold text-violet-700/80 dark:text-violet-200/80">
                Esses campos aparecem apenas para admin. O aluno liberado ve o video e o botao; o aluno sem acesso ve tudo bloqueado.
              </p>

              <button
                onClick={saveAdminLink}
                disabled={savingSettings || loadingSettings}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSettings || loadingSettings ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {savingSettings ? 'Salvando...' : 'Salvar links'}
              </button>
            </div>
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Video de explicacao
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
              O video tambem e liberado somente para quem comprou esse acesso.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black uppercase ${
            hasAccess
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
          }`}>
            {hasAccess ? <PlayCircle size={16} /> : <Lock size={16} />}
            {hasAccess ? 'Liberado' : 'Bloqueado'}
          </div>
        </div>

        {hasAccess && protectedVideoUrl ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-black dark:border-white/10">
            {isDirectVideo(protectedVideoUrl) ? (
              <video
                src={protectedVideoUrl}
                controls
                className="aspect-video w-full bg-black"
              />
            ) : (
              <iframe
                src={getVideoEmbedUrl(protectedVideoUrl)}
                title="Video de explicacao"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full border-0 bg-black"
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-black">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm dark:bg-white/10 dark:text-slate-300">
                <Lock size={28} />
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
                Video bloqueado
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-300">
                Quando o acesso for liberado no painel de alunos, o video de explicacao aparece aqui junto com o botao.
              </p>
            </div>
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        {hasAccess ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                Abrir acesso
              </h2>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-300">
                Clique para abrir em uma nova aba. Se o link mudar, basta trocar a variavel do servidor sem alterar a pagina.
              </p>
            </div>

            <button
              onClick={openProtectedLink}
              disabled={opening}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 text-sm font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-slate-200"
            >
              {opening ? <RefreshCw className="animate-spin" size={20} /> : <ExternalLink size={20} />}
              {opening ? 'Abrindo...' : 'Abrir acesso'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
              <Lock size={28} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Acesso bloqueado
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-300">
              Essa area e vendida separadamente. Quando voce liberar o aluno no painel admin, a aba aparece para ele e o botao fica disponivel.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default AIAccounts;
