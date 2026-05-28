import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  KeyRound,
  Loader2,
  PauseCircle,
  PlayCircle,
  Power,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GenerationJob, GenerationWorkerStatus, supabase } from '../lib/supabase';

const modelValue = 'veo-3.1-lite-lower-priority';
const modelLabel = 'Veo 3.1 - Lite [Lower Priority]';
const defaultFlowProjectUrl = 'https://labs.google/fx/tools/flow/project/3c44b205-a81a-4359-b4af-e001bea75c3a';
const flowControlUrl = 'http://localhost:8787';
const flowControlWsUrl = 'ws://127.0.0.1:8787';
const flowProjectStorageKey = 'central-flow-project-url';
const aspectRatios = ['9:16', '16:9'];
const durations = [4, 6, 8];
const quantities = [1, 2, 3, 4];

const statusLabels: Record<GenerationJob['status'], string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluido',
  failed: 'Falhou',
};

const statusClasses: Record<GenerationJob['status'], string> = {
  pending: 'bg-amber-500/10 text-amber-700 ring-amber-200',
  processing: 'bg-blue-500/10 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-500/10 text-red-700 ring-red-200',
};

const normalizeMetadata = (metadata: unknown) => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata as Record<string, any>;
};

const requestFlowControl = async (path: string, body?: Record<string, unknown>) => {
  const tryWebSocket = () =>
    new Promise<any>((resolve, reject) => {
      const socket = new WebSocket(flowControlWsUrl);
      const timeout = window.setTimeout(() => {
        socket.close();
        reject(new Error('Servidor local do Flow nao respondeu.'));
      }, 8000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ path, body }));
      };

      socket.onmessage = (event) => {
        window.clearTimeout(timeout);
        socket.close();
        resolve(JSON.parse(event.data));
      };

      socket.onerror = () => {
        window.clearTimeout(timeout);
        socket.close();
        reject(new Error('Servidor local do Flow nao respondeu.'));
      };
    });

  try {
    return await tryWebSocket();
  } catch {
    const response = await fetch(`${flowControlUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(payload.error || 'Servidor local do Flow nao respondeu.');
    return payload;
  }
};

const videoUrlsForJob = (job: GenerationJob) => {
  if (job.status !== 'completed') return [];
  const metadata = normalizeMetadata(job.metadata);
  const urls = new Set<string>();

  if (job.result_url) urls.add(job.result_url);
  if (Array.isArray(metadata.result_urls)) {
    metadata.result_urls.filter(Boolean).forEach((url: string) => urls.add(url));
  }

  return [...urls];
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getWorkerOnline = (workerStatus: GenerationWorkerStatus | null) => {
  if (!workerStatus?.online_until) return false;
  return new Date(workerStatus.online_until).getTime() > Date.now();
};

const friendlyFailureMessage = (job: GenerationJob) => {
  const metadata = normalizeMetadata(job.metadata);
  const technicalMessage = job.error_message || metadata.error || '';

  if (/limit|cota|quota|rate/i.test(technicalMessage)) {
    return 'Limite do Flow atingido agora. Seu pedido pode ser reenviado mais tarde.';
  }

  if (/policy|politica|conte[uú]do|blocked|bloque/i.test(technicalMessage)) {
    return 'O Flow bloqueou esse prompt. Ajuste o texto e tente novamente.';
  }

  return 'Nao foi possivel gerar este video. Tente novamente com outro prompt.';
};

const friendlyDbError = (message: string) => {
  if (/generation_jobs|generation_worker_status|schema cache|Could not find the table/i.test(message)) {
    return 'O gerador de videos ainda precisa ser ativado no Supabase. Rode o SQL de configuracao antes de liberar para os alunos.';
  }

  return message;
};

const GerarVideos: React.FC = () => {
  const { user, profile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState(8);
  const [quantity, setQuantity] = useState(1);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [workerStatus, setWorkerStatus] = useState<GenerationWorkerStatus | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [downloadingUrl, setDownloadingUrl] = useState('');
  const [flowProjectUrl, setFlowProjectUrl] = useState(() =>
    localStorage.getItem(flowProjectStorageKey) || defaultFlowProjectUrl,
  );
  const [savingFlowProject, setSavingFlowProject] = useState(false);
  const [openingFlowLogin, setOpeningFlowLogin] = useState(false);
  const [localWorkerStatus, setLocalWorkerStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown');
  const [flowControlOnline, setFlowControlOnline] = useState(false);
  const [togglingWorker, setTogglingWorker] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isAdmin = profile?.role === 'admin';

  const workerOnline = getWorkerOnline(workerStatus);
  const jobsByStatus = useMemo(
    () => ({
      pending: jobs.filter((job) => job.status === 'pending').length,
      processing: jobs.filter((job) => job.status === 'processing').length,
      completed: jobs.filter((job) => job.status === 'completed').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    }),
    [jobs],
  );

  const completedJobs = jobs.filter((job) => job.status === 'completed');

  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('type', 'video')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);

    if (fetchError) {
      setError(friendlyDbError(fetchError.message));
    } else {
      setJobs((data || []) as GenerationJob[]);
    }

    setLoadingJobs(false);
  };

  const fetchWorkerStatus = async () => {
    const { data } = await supabase
      .from('generation_worker_status')
      .select('*')
      .eq('id', 'flow-video')
      .maybeSingle();

    if (data) setWorkerStatus(data as GenerationWorkerStatus);
  };

  const refreshLocalFlowProject = async () => {
    if (!isAdmin) return;

    try {
      const payload = await requestFlowControl('/health');

      if (payload.ok !== false && payload.flowProjectUrl) {
        setFlowProjectUrl(payload.flowProjectUrl);
        localStorage.setItem(flowProjectStorageKey, payload.flowProjectUrl);
        setFlowControlOnline(true);
        setLocalWorkerStatus(payload.localWorkerStatus === 'running' ? 'running' : 'stopped');
      }
    } catch {
      setFlowControlOnline(false);
      setLocalWorkerStatus('unknown');
      // O servidor local pode estar desligado. A tela continua funcionando para os alunos.
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchWorkerStatus();
    refreshLocalFlowProject();

    const interval = window.setInterval(() => {
      fetchJobs();
      fetchWorkerStatus();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;

    const channel = supabase
      .channel(`generation-jobs-video-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchJobs(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_worker_status',
          filter: 'id=eq.flow-video',
        },
        () => fetchWorkerStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const submitJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Faca login novamente para gerar video.');
      return;
    }

    if (!prompt.trim()) {
      setError('Escreva o prompt do video.');
      return;
    }

    setSubmitting(true);

    const metadata = {
      quantity,
      aspect_ratio: aspectRatio,
      duration_seconds: duration,
      mode: 'text-to-video',
      reference_images: [],
      model_label: modelLabel,
      requested_by_email: profile?.email || user.email || null,
    };

    const { error: insertError } = await supabase.from('generation_jobs').insert({
      user_id: user.id,
      type: 'video',
      status: 'pending',
      prompt: prompt.trim(),
      model: modelValue,
      metadata,
    });

    if (insertError) {
      setError(friendlyDbError(insertError.message));
    } else {
      setPrompt('');
      setSuccess(
        workerOnline
          ? 'Pedido criado. O gerador esta online e vai pegar seu video na fila.'
          : 'Pedido criado. Ele ficara salvo e sera processado quando o gerador estiver ligado.',
      );
      await fetchJobs();
    }

    setSubmitting(false);
  };

  const deleteJob = async (job: GenerationJob) => {
    if (!['pending', 'failed'].includes(job.status)) return;
    setDeletingId(job.id);
    setError('');

    const { error: deleteError } = await supabase
      .from('generation_jobs')
      .delete()
      .eq('id', job.id)
      .eq('user_id', user?.id);

    if (deleteError) setError(friendlyDbError(deleteError.message));
    await fetchJobs();
    setDeletingId('');
  };

  const downloadVideo = async (url: string, jobId: string, index: number) => {
    setDownloadingUrl(url);
    setError('');

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Nao foi possivel baixar o video.');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `video-flow-${jobId.slice(0, 8)}${index > 0 ? `-${index + 1}` : ''}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError: any) {
      setError(downloadError.message || 'Nao foi possivel baixar o video.');
    } finally {
      setDownloadingUrl('');
    }
  };

  const saveFlowProject = async () => {
    const cleanUrl = flowProjectUrl.trim();

    if (!/^https:\/\/labs\.google\/fx\/tools\/flow\/project\/[a-z0-9-]+$/i.test(cleanUrl)) {
      setError('Cole um link de projeto do Flow no formato https://labs.google/fx/tools/flow/project/...');
      return false;
    }

    setSavingFlowProject(true);
    setError('');
    setSuccess('');

    try {
      localStorage.setItem(flowProjectStorageKey, cleanUrl);
      const payload = await requestFlowControl('/flow-project', { flowProjectUrl: cleanUrl });

      if (payload.ok === false) {
        throw new Error(payload.error || 'Servidor local do Flow nao respondeu.');
      }

      setFlowProjectUrl(payload.flowProjectUrl || cleanUrl);
      if (payload.localWorkerStatus) {
        setLocalWorkerStatus(payload.localWorkerStatus === 'running' ? 'running' : 'stopped');
      }
      setFlowControlOnline(true);
      setSuccess('Projeto Flow/Veo 3 salvo para o worker local.');
      return true;
    } catch (flowError: any) {
      setFlowControlOnline(false);
      setError(flowError.message || 'Ligue o servidor local do Flow antes de salvar o projeto.');
      return false;
    } finally {
      setSavingFlowProject(false);
    }
  };

  const openFlowLogin = async () => {
    setOpeningFlowLogin(true);
    setError('');
    setSuccess('');

    try {
      const saved = await saveFlowProject();
      if (!saved) return;

      const payload = await requestFlowControl('/flow-login', {});

      if (payload.ok === false) {
        throw new Error(payload.error || 'Servidor local do Flow nao respondeu.');
      }

      setSuccess('Flow aberto no navegador correto. Faca login ou confira se o projeto abriu no Veo 3.');
      setFlowControlOnline(true);
      setLocalWorkerStatus(payload.localWorkerStatus === 'running' ? 'running' : 'stopped');
    } catch (flowError: any) {
      setFlowControlOnline(false);
      setError(flowError.message || 'Nao foi possivel abrir o login do Flow.');
    } finally {
      setOpeningFlowLogin(false);
    }
  };

  const toggleWorker = async (nextAction: 'start' | 'stop') => {
    setTogglingWorker(true);
    setError('');
    setSuccess('');

    try {
      if (nextAction === 'start') {
        const saved = await saveFlowProject();
        if (!saved) return;
      }

      const payload = await requestFlowControl(`/worker/${nextAction}`, {});

      if (payload.ok === false) {
        throw new Error(payload.error || 'Servidor local do Flow nao respondeu.');
      }

      setFlowControlOnline(true);
      setLocalWorkerStatus(payload.localWorkerStatus === 'running' ? 'running' : 'stopped');
      await fetchWorkerStatus();

      setSuccess(
        nextAction === 'start'
          ? 'Gerador liberado. Os pedidos dos alunos agora entram na fila do Flow neste computador.'
          : 'Gerador pausado. Os alunos ainda podem deixar pedidos salvos para processar depois.',
      );
    } catch (flowError: any) {
      setFlowControlOnline(false);
      setError(flowError.message || 'Nao foi possivel controlar o gerador local.');
    } finally {
      setTogglingWorker(false);
    }
  };

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-slate-950 px-3 py-6 text-white sm:-mx-6 sm:-my-6 sm:px-8 sm:py-10 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-[#080b12] p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <Film size={14} />
                Gerador com Flow
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Gerar Videos</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-slate-400 sm:text-base">
                Crie pedidos de video por texto. O processamento acontece por fila quando o computador do gerador estiver ligado.
              </p>
            </div>

            <div
              className={`rounded-2xl border px-5 py-4 ${
                workerOnline
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <span className={`h-2.5 w-2.5 rounded-full ${workerOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {workerOnline ? 'Gerador online' : 'Gerador pausado'}
              </div>
              <p className="mt-1 max-w-sm text-xs font-semibold opacity-80">
                {workerOnline
                  ? workerStatus?.message || 'Seus videos entram na fila e podem ser processados agora.'
                  : 'Seu pedido fica salvo e sera gerado automaticamente quando eu ligar o computador.'}
              </p>
            </div>
          </div>
        </motion.section>

        {isAdmin && (
          <section className="rounded-[2rem] border border-orange-500/20 bg-orange-500/10 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Controle admin do worker
                </p>
                <label className="mt-3 block text-sm font-black text-white" htmlFor="flow-project-url">
                  Link do projeto Flow/Veo 3
                </label>
                <input
                  id="flow-project-url"
                  value={flowProjectUrl}
                  onChange={(event) => setFlowProjectUrl(event.target.value)}
                  placeholder="https://labs.google/fx/tools/flow/project/..."
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
                />
                <p className="mt-2 text-xs font-semibold text-orange-100/80">
                  Use um perfil separado do navegador: abra o Flow, faca login, depois libere o gerador para os alunos.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:w-[540px]">
                <button
                  type="button"
                  onClick={saveFlowProject}
                  disabled={savingFlowProject}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-orange-500/30 bg-black/30 px-4 text-xs font-black uppercase tracking-wide text-orange-100 hover:bg-orange-500/20 disabled:opacity-50"
                >
                  {savingFlowProject ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Salvar projeto
                </button>
                <button
                  type="button"
                  onClick={openFlowLogin}
                  disabled={openingFlowLogin}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-white disabled:opacity-50"
                >
                  {openingFlowLogin ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                  Abrir Flow
                </button>
                <button
                  type="button"
                  onClick={() => toggleWorker('start')}
                  disabled={togglingWorker || localWorkerStatus === 'running'}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-white disabled:opacity-50"
                >
                  {togglingWorker ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
                  Liberar gerador
                </button>
                <button
                  type="button"
                  onClick={() => toggleWorker('stop')}
                  disabled={togglingWorker || localWorkerStatus === 'stopped'}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 text-xs font-black uppercase tracking-wide text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {togglingWorker ? <Loader2 className="animate-spin" size={16} /> : <PauseCircle size={16} />}
                  Pausar
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide">
              <span className={`rounded-full px-3 py-1 ${flowControlOnline ? 'bg-emerald-500/15 text-emerald-100' : 'bg-amber-500/15 text-amber-100'}`}>
                Servidor local: {flowControlOnline ? 'ligado' : 'nao detectado'}
              </span>
              <span className={`rounded-full px-3 py-1 ${localWorkerStatus === 'running' ? 'bg-emerald-500/15 text-emerald-100' : 'bg-white/10 text-slate-200'}`}>
                Worker: {localWorkerStatus === 'running' ? 'liberado' : localWorkerStatus === 'stopped' ? 'pausado' : 'desconhecido'}
              </span>
            </div>
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={submitJob}
            className="rounded-[2rem] border border-white/10 bg-[#080b12] p-5 shadow-2xl shadow-black/30 sm:p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
              <PlayCircle size={18} className="text-orange-400" />
              Novo video
            </h2>

            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={8}
              maxLength={2500}
              placeholder="Descreva o video que deseja gerar..."
              className="w-full resize-y rounded-2xl border border-white/10 bg-black/60 p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Modelo</p>
              <p className="mt-1 text-sm font-black">{modelLabel}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Travado no modo de menor prioridade para manter o uso gratuito pelo Flow.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Formato</p>
                <div className="grid grid-cols-2 gap-2">
                  {aspectRatios.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAspectRatio(item)}
                      className={`h-12 rounded-xl text-sm font-black ${
                        aspectRatio === item
                          ? 'bg-orange-500 text-black'
                          : 'border border-white/10 bg-black/50 text-slate-300 hover:border-orange-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Duracao</p>
                <div className="grid grid-cols-3 gap-2">
                  {durations.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDuration(item)}
                      className={`h-12 rounded-xl text-sm font-black ${
                        duration === item
                          ? 'bg-orange-500 text-black'
                          : 'border border-white/10 bg-black/50 text-slate-300 hover:border-orange-500'
                      }`}
                    >
                      {item}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Quantidade</p>
                <div className="grid grid-cols-4 gap-2">
                  {quantities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuantity(item)}
                      className={`h-12 rounded-xl text-sm font-black ${
                        quantity === item
                          ? 'bg-orange-500 text-black'
                          : 'border border-white/10 bg-black/50 text-slate-300 hover:border-orange-500'
                      }`}
                    >
                      {item}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 flex gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
                <CheckCircle2 size={18} className="shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={!prompt.trim() || submitting}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-black shadow-[0_18px_60px_rgba(249,115,22,0.25)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {submitting ? 'Enviando...' : 'Gerar video'}
            </button>
          </form>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              {(['pending', 'processing', 'completed', 'failed'] as GenerationJob['status'][]).map((status) => (
                <div key={status} className="rounded-2xl border border-white/10 bg-[#080b12] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{statusLabels[status]}</p>
                  <p className="mt-2 text-3xl font-black">{jobsByStatus[status]}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#080b12] p-5 shadow-2xl shadow-black/30 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Fila</p>
                  <h2 className="text-2xl font-black">Meus pedidos</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetchJobs();
                    fetchWorkerStatus();
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500"
                >
                  <RefreshCw size={15} className={loadingJobs ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold leading-relaxed text-blue-100">
                <Clock3 size={18} className="mr-2 inline" />
                Horario de funcionamento: quando o computador do gerador estiver ligado. Fora desse horario, seu pedido fica pendente na fila.
              </div>

              <div className="space-y-3">
                {jobs.length ? (
                  jobs.map((job) => {
                    const metadata = normalizeMetadata(job.metadata);
                    const videoUrls = videoUrlsForJob(job);

                    return (
                      <article key={job.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ring-1 ${statusClasses[job.status]}`}>
                                {statusLabels[job.status]}
                              </span>
                              <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black text-slate-300">
                                {metadata.aspect_ratio || '9:16'}
                              </span>
                              <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black text-slate-300">
                                {metadata.duration_seconds || 8}s
                              </span>
                              <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black text-slate-300">
                                {metadata.quantity || 1}x
                              </span>
                            </div>
                            <p className="line-clamp-3 text-sm font-bold leading-relaxed text-slate-100">{job.prompt}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">{formatDate(job.created_at)}</p>
                          </div>

                          {['pending', 'failed'].includes(job.status) && (
                            <button
                              type="button"
                              onClick={() => deleteJob(job)}
                              disabled={deletingId === job.id}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-xs font-black uppercase tracking-wide text-red-200 hover:bg-red-500/20 disabled:opacity-40"
                            >
                              {deletingId === job.id ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                              Remover
                            </button>
                          )}
                        </div>

                        {job.status === 'failed' && (
                          <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                            {friendlyFailureMessage(job)}
                          </div>
                        )}

                        {videoUrls.length > 0 && (
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {videoUrls.map((url, index) => (
                              <div key={url} className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                                <video controls playsInline crossOrigin="anonymous" src={url} className="aspect-video w-full bg-black object-contain" />
                                <button
                                  type="button"
                                  onClick={() => downloadVideo(url, job.id, index)}
                                  disabled={downloadingUrl === url}
                                  className="flex h-12 items-center justify-center gap-2 border-t border-white/10 text-sm font-black text-orange-200 hover:bg-white/5"
                                >
                                  {downloadingUrl === url ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                  {downloadingUrl === url ? 'Baixando...' : `Baixar MP4 ${videoUrls.length > 1 ? index + 1 : ''}`}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm font-bold text-slate-500">
                    Seus videos aparecem aqui depois que voce criar o primeiro pedido.
                  </div>
                )}
              </div>
            </div>

            {completedJobs.length > 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-[#080b12] p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Galeria</p>
                <h2 className="mb-4 text-2xl font-black">Videos concluidos</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {completedJobs.flatMap((job) =>
                    videoUrlsForJob(job).map((url) => (
                      <video key={`${job.id}-${url}`} controls playsInline crossOrigin="anonymous" src={url} className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-contain" />
                    )),
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GerarVideos;
