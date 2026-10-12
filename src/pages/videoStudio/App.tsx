import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Clapperboard,
  Coins,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';
import { useAuth } from '../../context/AuthContext';

type Generation = {
  id: string;
  model: string;
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  duration_seconds: number;
  status: string;
  video_url: string | null;
  credits_charged: number | null;
  created_at: string;
};

const MODELS = [
  { id: 'ltx-2.5', label: 'LTX 2.5 (recomendado, gratis)', maxDuration: 60 },
  { id: 'minimax-h3', label: 'MiniMax H3', maxDuration: 30 },
];

const RESOLUTIONS = [
  { id: '480p', label: '480p (gratis)', paidOnly: false },
  { id: '720p', label: '720p (requer plano pago)', paidOnly: true },
  { id: '1080p', label: '1080p (requer plano pago)', paidOnly: true },
];

const CREDIT_RATES: Record<string, Record<string, number>> = {
  'ltx-2.5': { '480p': 24, '720p': 48, '1080p': 72 },
  'minimax-h3': { '480p': 24, '720p': 48, '1080p': 72 },
};

const DURATIONS = [5, 6, 8, 10, 15, 20, 30];

const MAGIC_HOUR_SIGNUP_URL = 'https://magichour.ai/sign-up?invite=cmv5vkmys01ejko01majf0rjc';
const MAGIC_HOUR_API_KEYS_URL = 'https://magichour.ai/developer?tab=api-keys';

const callAgent = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';

  const response = await fetch('/api/agents/video-studio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(await describeHttpError(response, 'Nao consegui falar com o estudio de videos.'));
  }

  return response.json();
};

const statusLabel: Record<string, string> = {
  queued: 'Na fila',
  rendering: 'Gerando video',
  complete: 'Pronto',
  error: 'Falhou',
  canceled: 'Cancelado',
};

const VideoStudio: React.FC = () => {
  const { user } = useAuth();

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('ltx-2.5');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('480p');
  const [audio, setAudio] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStatus, setActiveStatus] = useState<string>('');
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [history, setHistory] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);

  const selectedModel = MODELS.find((item) => item.id === model) || MODELS[0];
  const rate = CREDIT_RATES[model]?.[resolution] || 24;
  const estimatedCredits = rate * duration;

  const loadKeyState = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_video_keys')
        .select('provider, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      setHasKey(Boolean(data));
    } catch {
      setHasKey(false);
    }
  }, [user?.id]);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);

    try {
      const data = await callAgent('history');
      setHistory(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadKeyState();
    loadHistory();
  }, [loadKeyState, loadHistory]);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (elapsedRef.current) window.clearInterval(elapsedRef.current);
  }, []);

  const saveKey = async () => {
    if (!user?.id) return;

    const value = keyInput.trim();
    if (!value) {
      setKeyMessage({ type: 'error', text: 'Cole a chave da API da Magic Hour.' });
      return;
    }

    if (!value.startsWith('mhk_') && !value.startsWith('mh_')) {
      setKeyMessage({
        type: 'error',
        text: 'Essa chave parece invalida. Cole a chave da Magic Hour (comeca com "mhk_").',
      });
      return;
    }

    setKeySaving(true);
    setKeyMessage(null);

    const { error: saveError } = await supabase.from('user_video_keys').upsert({
      id: user.id,
      provider: 'magichour',
      api_key: value,
      updated_at: new Date().toISOString(),
    });

    setKeySaving(false);

    if (saveError) {
      console.error('Erro ao salvar chave de video:', saveError);

      const detail = String(saveError.message || '');
      const tableMissing =
        detail.toLowerCase().includes('does not exist') ||
        detail.toLowerCase().includes('schema cache') ||
        detail.toLowerCase().includes('could not find the table');

      setKeyMessage({
        type: 'error',
        text: tableMissing
          ? 'O sistema de videos ainda nao foi ativado no banco de dados (falta rodar o SQL de instalacao no Supabase). Se voce e o dono da plataforma, rode o arquivo sql/video-studio.sql no SQL Editor do Supabase e tente novamente.'
          : `Nao consegui salvar a chave (${saveError.code || 'erro'}: ${detail || 'sem detalhe'}). Tente novamente.`,
      });
      return;
    }

    setHasKey(true);
    setKeyInput('');
    setShowKeyForm(false);
    setKeyMessage({ type: 'success', text: 'Chave salva! Agora e so gerar seu video.' });
    loadCredits();
  };

  const removeKey = async () => {
    if (!user?.id) return;

    const { error: removeError } = await supabase
      .from('user_video_keys')
      .update({ api_key: '', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (removeError) {
      setKeyMessage({ type: 'error', text: 'Nao consegui remover a chave.' });
      return;
    }

    setHasKey(false);
    setCredits(null);
    setKeyMessage({ type: 'success', text: 'Chave removida.' });
  };

  const loadCredits = async () => {
    setCreditsLoading(true);
    setKeyMessage(null);

    try {
      const data = await callAgent('account');
      setCredits(typeof data?.credits === 'number' ? data.credits : null);
    } catch (err: any) {
      setKeyMessage({ type: 'error', text: err?.message || 'Nao consegui consultar seus creditos.' });
    } finally {
      setCreditsLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      window.clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  };

  const startPolling = (generationId: string) => {
    stopPolling();
    setElapsed(0);
    setActiveStatus('queued');

    elapsedRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const startedAt = Date.now();

    pollRef.current = window.setInterval(async () => {
      if (Date.now() - startedAt > 15 * 60 * 1000) {
        stopPolling();
        setGenerating(false);
        setError('A geracao esta demorando mais que o normal. Voce pode acompanhar pelo historico abaixo.');
        loadHistory();
        return;
      }

      try {
        const data = await callAgent('status', { generationId });
        setActiveStatus(String(data?.status || 'rendering'));

        if (data?.status === 'complete') {
          stopPolling();
          setGenerating(false);
          setResultVideoUrl(data?.video_url || null);
          loadHistory();
          loadCredits();
        } else if (data?.status === 'error' || data?.status === 'canceled') {
          stopPolling();
          setGenerating(false);
          setError(data?.error_message || 'A geracao falhou na Magic Hour. Seus creditos sao reembolsados automaticamente em caso de falha.');
          loadHistory();
        }
      } catch (err: any) {
        stopPolling();
        setGenerating(false);
        setError(err?.message || 'Nao consegui acompanhar a geracao.');
        loadHistory();
      }
    }, 6000);
  };

  const handleGenerate = async () => {
    if (!hasKey) {
      setError('Configure sua chave da Magic Hour primeiro.');
      return;
    }

    if (prompt.trim().length < 5) {
      setError('Escreva um prompt descrevendo o video que voce quer gerar.');
      return;
    }

    setGenerating(true);
    setError('');
    setResultVideoUrl(null);
    setActiveStatus('queued');

    try {
      const data = await callAgent('submit', {
        prompt: prompt.trim(),
        model,
        durationSeconds: duration,
        aspectRatio,
        resolution,
        audio,
      });

      startPolling(String(data?.generation_id || ''));
    } catch (err: any) {
      setGenerating(false);
      setError(err?.message || 'Nao consegui iniciar a geracao.');
      loadHistory();
    }
  };

  const qualityNote =
    resolution === '480p'
      ? 'No plano gratuito o video sai em 480p (qualidade de teste) e pode ter marca d agua. Para publicar e monetizar, adicione creditos na sua conta Magic Hour (a partir de US$ 10) — isso libera 720p/1080p, remove a marca d agua e libera o uso comercial.'
      : 'Resolucao em alta exige plano pago ou creditos na sua conta Magic Hour.';

  return (
    <div className="min-h-[80vh] overflow-hidden rounded-3xl bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <Clapperboard size={22} />
            </span>
            <div>
              <h1 className="text-lg font-black tracking-tight sm:text-xl">Estudio de Videos IA</h1>
              <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">
                Gere videos com a sua conta da Magic Hour (LTX 2.5 com audio nativo)
              </p>
            </div>
          </div>

          {hasKey && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                <CheckCircle2 size={13} /> Chave configurada
              </span>
              <button
                type="button"
                onClick={loadCredits}
                disabled={creditsLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-60"
              >
                {creditsLoading ? <Loader2 size={13} className="animate-spin" /> : <Coins size={13} />}
                {credits !== null ? `${credits} creditos` : 'Ver creditos'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
        {/* Aviso de erro */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {keyMessage && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              keyMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            {keyMessage.text}
          </div>
        )}

        {/* Chave da API */}
        {(!hasKey || showKeyForm) && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2">
              <KeyRound size={17} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-orange-300">
                Sua chave da Magic Hour
              </h2>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              O Estudio usa a <strong className="text-slate-200">sua propria conta</strong> de geracao de videos — assim voce
              usa os seus creditos gratuitos e a plataforma nao paga nada por voce. Sao 2 passos rapidos:
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href={MAGIC_HOUR_SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-black transition hover:brightness-110 sm:w-auto"
              >
                <Sparkles size={17} />
                1. Criar minha conta na Magic Hour (gratis, sem cartao)
              </a>

              <p className="text-xs leading-relaxed text-slate-400">
                2. Com a conta criada, entre no{' '}
                <a
                  href={MAGIC_HOUR_API_KEYS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-orange-300 underline"
                >
                  painel do desenvolvedor <ExternalLink size={11} className="inline" />
                </a>
                , clique em <strong className="text-slate-200">Create key</strong>, copie a chave (comeca com{' '}
                <strong className="text-slate-200">mhk_</strong>) e cole no campo abaixo. Ela fica guardada com seguranca e so
                o sistema usa — nunca aparece para outros alunos.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="Cole aqui a chave (mhk_live_...)"
                className="h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
              <button
                type="button"
                onClick={saveKey}
                disabled={keySaving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-60"
              >
                {keySaving ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
                Salvar chave
              </button>
            </div>
          </section>
        )}

        {hasKey && !showKeyForm && (
          <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] font-bold text-slate-500">
            <button
              type="button"
              onClick={() => setShowKeyForm(true)}
              className="inline-flex items-center gap-1 underline transition hover:text-slate-300"
            >
              <RefreshCw size={12} /> Trocar chave
            </button>
            <button
              type="button"
              onClick={removeKey}
              className="inline-flex items-center gap-1 text-red-400/80 underline transition hover:text-red-300"
            >
              <Trash2 size={12} /> Remover chave
            </button>
          </div>
        )}

        {/* Formulario */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-orange-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-orange-300">
              Gerar novo video
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Prompt do video (descreva a cena, o movimento e o som)
              </label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Ex: Mulher sorrindo na cozinha enquanto prepara um bolo, camera aproximando devagar, som ambiente da casa e o barulho da batedeira."
                className="mt-2 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm font-medium leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Modelo</label>
                <select
                  value={model}
                  onChange={(event) => {
                    const next = event.target.value;
                    setModel(next);
                    const nextModel = MODELS.find((item) => item.id === next) || MODELS[0];
                    if (duration > nextModel.maxDuration) setDuration(nextModel.maxDuration);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-orange-500"
                >
                  {MODELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Duracao (segundos)
                </label>
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-orange-500"
                >
                  {DURATIONS.filter((value) => value <= selectedModel.maxDuration).map((value) => (
                    <option key={value} value={value}>
                      {value}s
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Formato</label>
                <select
                  value={aspectRatio}
                  onChange={(event) => setAspectRatio(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-orange-500"
                >
                  <option value="9:16">9:16 (vertical - TikTok/Reels)</option>
                  <option value="16:9">16:9 (horizontal - YouTube)</option>
                  <option value="1:1">1:1 (quadrado)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Resolucao</label>
                <select
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-orange-500"
                >
                  {RESOLUTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={audio}
                  onChange={(event) => setAudio(event.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                Gerar com audio nativo (sem custo extra no LTX 2.5)
              </label>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-slate-800">
                <Coins size={13} className="text-orange-400" />
                Custo estimado: {estimatedCredits} creditos ({rate}/s)
              </span>
            </div>

            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
              {qualityNote}
            </p>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !hasKey}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-black uppercase tracking-wide text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? <Loader2 size={19} className="animate-spin" /> : <Play size={19} />}
              {generating ? 'Gerando video...' : 'Gerar video'}
            </button>
          </div>
        </section>

        {/* Progresso */}
        {generating && (
          <section className="rounded-3xl border border-orange-500/30 bg-orange-500/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-black text-orange-200">
                <Loader2 size={17} className="animate-spin" />
                {statusLabel[activeStatus] || 'Processando'}...
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Clock size={13} /> {elapsed}s (normal: 25-40s)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Pode deixar esta aba aberta — o video aparece aqui assim que ficar pronto. A geracao acontece nos
              servidores da Magic Hour.
            </p>
          </section>
        )}

        {/* Resultado */}
        {resultVideoUrl && (
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-200">
                <CheckCircle2 size={17} /> Video pronto!
              </span>
              <a
                href={resultVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-black transition hover:brightness-110"
              >
                <Download size={15} /> Baixar video
              </a>
            </div>
            <video
              src={resultVideoUrl}
              controls
              className="mx-auto mt-4 block max-h-[70vh] w-auto max-w-full rounded-2xl border border-slate-800 bg-black"
            />
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              Dica: baixe agora — os links dos provedores podem expirar depois de alguns dias.
            </p>
          </section>
        )}

        {/* Historico */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Historico de geracoes
            </h2>
            <button
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 underline transition hover:text-slate-200 disabled:opacity-60"
            >
              <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>

          {history.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Nenhuma geracao ainda. Seu primeiro video aparece aqui.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-200">{item.prompt}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {item.model} · {item.resolution} · {item.duration_seconds}s · {item.aspect_ratio} ·{' '}
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        item.status === 'complete'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : item.status === 'error' || item.status === 'canceled'
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-orange-500/15 text-orange-300'
                      }`}
                    >
                      {statusLabel[item.status] || item.status}
                    </span>

                    {item.video_url && (
                      <a
                        href={item.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-slate-700"
                      >
                        <Download size={12} /> Baixar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VideoStudio;
