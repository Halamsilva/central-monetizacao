import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Clock,
  Coins,
  Download,
  ExternalLink,
  Film,
  ImagePlus,
  KeyRound,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../receitasEbook/utils/imageCompressor';

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

type FrameAsset = {
  preview: string;
  base64: string;
  mimeType: string;
  name: string;
};

const MODELS = [
  { id: 'ltx-2.5', label: 'LTX 2.5', maxDuration: 60 },
  { id: 'minimax-h3', label: 'MiniMax H3', maxDuration: 30 },
];

const RESOLUTIONS = [
  { id: '480p', label: '480p gratis' },
  { id: '720p', label: '720p pago' },
  { id: '1080p', label: '1080p pago' },
];

const CREDIT_RATES: Record<string, Record<string, number>> = {
  'ltx-2.5': { '480p': 24, '720p': 48, '1080p': 72 },
  'minimax-h3': { '480p': 24, '720p': 48, '1080p': 72 },
};

const DURATIONS = [5, 10, 15, 30];

const RATIOS = [
  { id: '9:16', label: '9:16', hint: 'TikTok / Reels' },
  { id: '16:9', label: '16:9', hint: 'YouTube' },
  { id: '1:1', label: '1:1', hint: 'Quadrado' },
];

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
  uploading: 'Preparando imagem',
  queued: 'Na fila',
  rendering: 'Gerando video',
  complete: 'Pronto',
  error: 'Falhou',
  canceled: 'Cancelado',
};

const aspectClass: Record<string, string> = {
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
  '1:1': 'aspect-square',
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
  const [frame, setFrame] = useState<FrameAsset | null>(null);
  const [frameBusy, setFrameBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<Generation | null>(null);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStatus, setActiveStatus] = useState<string>('');
  const [error, setError] = useState('');

  const [history, setHistory] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedModel = MODELS.find((item) => item.id === model) || MODELS[0];
  const rate = CREDIT_RATES[model]?.[resolution] || 24;
  const estimatedCredits = rate * duration;

  const loadKeyState = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_secrets')
        .select('video_api_key')
        .eq('id', user.id)
        .maybeSingle();

      setHasKey(Boolean(String(data?.video_api_key || '').trim()));
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

    const { error: saveError } = await supabase.from('user_secrets').upsert({
      id: user.id,
      video_api_key: value,
      video_provider: 'magichour',
      updated_at: new Date().toISOString(),
    });

    setKeySaving(false);

    if (saveError) {
      console.error('Erro ao salvar chave de video:', saveError);

      const detail = String(saveError.message || '');
      setKeyMessage({
        type: 'error',
        text: `Nao consegui salvar a chave (${saveError.code || 'erro'}: ${detail || 'sem detalhe'}). Tente novamente.`,
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
      .from('user_secrets')
      .update({ video_api_key: '', updated_at: new Date().toISOString() })
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

  const startPolling = (
    generationId: string,
    meta: { prompt: string; model: string; duration: number; aspectRatio: string; resolution: string }
  ) => {
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
        setError('A geracao esta demorando mais que o normal. Voce pode acompanhar pela galeria abaixo.');
        loadHistory();
        return;
      }

      try {
        const data = await callAgent('status', { generationId });
        setActiveStatus(String(data?.status || 'rendering'));

        if (data?.status === 'complete') {
          stopPolling();
          setGenerating(false);

          const finished: Generation = {
            id: generationId,
            model: meta.model,
            prompt: meta.prompt,
            aspect_ratio: meta.aspectRatio,
            resolution: meta.resolution,
            duration_seconds: meta.duration,
            status: 'complete',
            video_url: data?.video_url || null,
            credits_charged: typeof data?.credits_charged === 'number' ? data.credits_charged : null,
            created_at: new Date().toISOString(),
          };

          setComposerOpen(false);
          setFrame(null);
          setPrompt('');
          setSelected(finished);
          loadHistory();
          loadCredits();
        } else if (data?.status === 'error' || data?.status === 'canceled') {
          stopPolling();
          setGenerating(false);
          setError(
            data?.error_message ||
              'A geracao falhou na Magic Hour. Seus creditos sao reembolsados automaticamente em caso de falha.'
          );
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

  const handleFrameFile = async (file?: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem (JPG ou PNG).');
      return;
    }

    setFrameBusy(true);
    setError('');

    try {
      const compressed = await compressImageFile(file, 1600, 0.9);
      const preview = `data:${compressed.mimeType};base64,${compressed.base64}`;

      setFrame({
        preview,
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        name: file.name,
      });

      const probe = new Image();
      probe.onload = () => {
        if (probe.height > probe.width) setAspectRatio('9:16');
        else if (probe.width > probe.height) setAspectRatio('16:9');
      };
      probe.src = preview;
    } catch (err: any) {
      setError(err?.message || 'Nao consegui preparar essa imagem. Tente outra foto.');
    } finally {
      setFrameBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasKey) {
      setError('Configure sua chave da Magic Hour primeiro.');
      return;
    }

    if (!frame && prompt.trim().length < 5) {
      setError('Escreva um prompt ou envie uma imagem inicial.');
      return;
    }

    setGenerating(true);
    setError('');
    setActiveStatus(frame ? 'uploading' : 'queued');

    try {
      let imageFilePath = '';

      if (frame) {
        const uploaded = await callAgent('upload-frame', {
          imageBase64: frame.base64,
          mimeType: frame.mimeType,
        });

        imageFilePath = String(uploaded?.filePath || '');

        if (!imageFilePath) {
          throw new Error('Nao consegui preparar a imagem inicial. Tente novamente.');
        }

        setActiveStatus('queued');
      }

      const data = await callAgent('submit', {
        prompt: prompt.trim(),
        model,
        durationSeconds: duration,
        aspectRatio,
        resolution,
        audio,
        imageFilePath,
      });

      startPolling(String(data?.generation_id || ''), {
        prompt: prompt.trim() || 'Animacao a partir da imagem inicial',
        model,
        duration,
        aspectRatio,
        resolution,
      });
    } catch (err: any) {
      setGenerating(false);
      setError(err?.message || 'Nao consegui iniciar a geracao.');
      loadHistory();
    }
  };

  const openComposer = () => {
    setError('');
    setComposerOpen(true);
  };

  const qualityNote =
    resolution === '480p'
      ? 'No plano gratuito o video sai em 480p (qualidade de teste) e pode ter marca d agua. Para publicar e monetizar, adicione creditos na sua conta Magic Hour (a partir de US$ 10) — isso libera 720p/1080p, remove a marca d agua e libera o uso comercial.'
      : 'Resolucao em alta exige plano pago ou creditos na sua conta Magic Hour.';

  const keyGate = hasKey === false || showKeyForm;

  return (
    <div className="min-h-[80vh] overflow-hidden rounded-3xl bg-[#0a0a0c] text-slate-100">
      <div className="border-b border-white/5 bg-[#0a0a0c]/90 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-orange-400 ring-1 ring-white/10">
              <Clapperboard size={20} />
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight sm:text-lg">Estudio de Videos IA</h1>
              <p className="text-[11px] font-semibold text-slate-500">
                Crie videos a partir de texto ou de uma imagem inicial
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasKey && (
              <>
                <button
                  type="button"
                  onClick={loadCredits}
                  disabled={creditsLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                >
                  {creditsLoading ? <Loader2 size={13} className="animate-spin" /> : <Coins size={13} className="text-orange-400" />}
                  {credits !== null ? `${credits} creditos` : 'Ver creditos'}
                </button>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 size={13} /> Chave ativa
                </span>
              </>
            )}

            {hasKey && !keyGate && (
              <button
                type="button"
                onClick={openComposer}
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-black transition hover:brightness-110"
              >
                <Plus size={15} /> Nova criacao
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
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

        {keyGate && (
          <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#121215] p-6">
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
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-black transition hover:brightness-110"
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
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-[#0a0a0c] px-4 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
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

            {hasKey && (
              <button
                type="button"
                onClick={() => setShowKeyForm(false)}
                className="mt-4 text-[11px] font-bold text-slate-400 underline transition hover:text-slate-200"
              >
                Voltar para a galeria
              </button>
            )}
          </section>
        )}

        {!keyGate && (
          <>
            {generating && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/5 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-xs font-black text-orange-200">
                  <Loader2 size={15} className="animate-spin" />
                  {statusLabel[activeStatus] || 'Processando'}...
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Clock size={12} /> {elapsed}s (normal: 25-60s)
                </span>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Meus projetos</h2>

              <div className="flex items-center gap-3 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={historyLoading}
                  className="inline-flex items-center gap-1 text-slate-400 underline transition hover:text-slate-200 disabled:opacity-60"
                >
                  <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} /> Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyForm(true)}
                  className="inline-flex items-center gap-1 text-slate-500 underline transition hover:text-slate-300"
                >
                  <KeyRound size={12} /> Trocar chave
                </button>
                <button
                  type="button"
                  onClick={removeKey}
                  className="inline-flex items-center gap-1 text-red-400/80 underline transition hover:text-red-300"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0f0f12] px-6 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-400 ring-1 ring-white/10">
                  <Film size={26} />
                </span>
                <h3 className="mt-4 text-base font-black text-slate-200">Nenhum video ainda</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Crie seu primeiro video: descreva a cena ou envie uma imagem inicial e a IA anima pra voce.
                </p>
                <button
                  type="button"
                  onClick={openComposer}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-black text-black transition hover:brightness-110"
                >
                  <Plus size={16} /> Criar meu primeiro video
                </button>
              </section>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {history.map((item) => {
                  const ready = item.status === 'complete' && item.video_url;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215] text-left transition hover:border-orange-500/40"
                    >
                      <div className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                        {ready ? (
                          <video
                            src={`${item.video_url}#t=0.1`}
                            preload="metadata"
                            muted
                            playsInline
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-600">
                            {item.status === 'error' || item.status === 'canceled' ? (
                              <AlertCircle size={26} className="text-red-400/70" />
                            ) : (
                              <Loader2 size={26} className="animate-spin text-orange-400/70" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {statusLabel[item.status] || item.status}
                            </span>
                          </div>
                        )}

                        {ready && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black">
                              <Play size={18} className="ml-0.5" />
                            </span>
                          </span>
                        )}

                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-200 backdrop-blur">
                          {item.aspect_ratio}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black text-slate-200 backdrop-blur">
                          {item.duration_seconds}s
                        </span>
                      </div>

                      <div className="p-2.5">
                        <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-300">
                          {item.prompt || 'Video a partir de imagem'}
                        </p>
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                          {item.model} · {item.resolution}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
              {qualityNote}
            </p>
          </>
        )}
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="my-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-[#121215] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <Wand2 size={17} className="text-orange-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-orange-300">Nova criacao</h2>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Imagem inicial <span className="text-slate-600">(opcional)</span>
                </label>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    handleFrameFile(event.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex aspect-[9/16] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                    dragging ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#0a0a0c] hover:border-white/25'
                  }`}
                >
                  {frame ? (
                    <>
                      <img src={frame.preview} alt="Imagem inicial" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setFrame(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-slate-200 transition hover:bg-red-500 hover:text-white"
                        aria-label="Remover imagem"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : frameBusy ? (
                    <Loader2 size={24} className="animate-spin text-orange-400" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-500">
                      <UploadCloud size={26} className="text-orange-400/80" />
                      <span className="text-[11px] font-bold leading-snug">
                        Arraste uma foto
                        <br /> ou clique aqui
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600">JPG ou PNG</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    handleFrameFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />

                <p className="text-[10px] leading-relaxed text-slate-500">
                  {frame
                    ? 'A IA vai animar essa imagem. O formato do video segue a foto.'
                    : 'Sem imagem, o video e criado so com o texto. Com imagem, ela vira o primeiro quadro.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Descreva o video
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder={
                      frame
                        ? 'Ex: a pessoa sorri e olha para a camera, movimento suave, luz do fim da tarde.'
                        : 'Ex: Mulher sorrindo na cozinha enquanto prepara um bolo, camera aproximando devagar, som ambiente da casa.'
                    }
                    className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-[#0a0a0c] p-3.5 text-sm font-medium leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Formato</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {RATIOS.map((item) => {
                      const active = aspectRatio === item.id;
                      const locked = Boolean(frame) && item.id === '1:1';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => !locked && setAspectRatio(item.id)}
                          disabled={locked}
                          className={`rounded-xl border px-2 py-2 text-center transition ${
                            active
                              ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                              : 'border-white/10 bg-[#0a0a0c] text-slate-400 hover:border-white/25'
                          } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <span className="block text-xs font-black">{item.label}</span>
                          <span className="block text-[9px] font-semibold uppercase tracking-wide">{item.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Duracao</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DURATIONS.filter((value) => value <= selectedModel.maxDuration).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDuration(value)}
                          className={`h-9 min-w-[52px] rounded-xl border px-2 text-xs font-black transition ${
                            duration === value
                              ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                              : 'border-white/10 bg-[#0a0a0c] text-slate-400 hover:border-white/25'
                          }`}
                        >
                          {value}s
                        </button>
                      ))}
                    </div>
                  </div>

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
                      className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-[#0a0a0c] px-3 text-xs font-semibold text-slate-100 outline-none focus:border-orange-500"
                    >
                      {MODELS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Resolucao</label>
                    <select
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-[#0a0a0c] px-3 text-xs font-semibold text-slate-100 outline-none focus:border-orange-500"
                    >
                      {RESOLUTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold text-slate-300 sm:mt-7">
                    <input
                      type="checkbox"
                      checked={audio}
                      onChange={(event) => setAudio(event.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Audio nativo (sem custo extra)
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0a0a0c] px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                    <Coins size={13} className="text-orange-400" />
                    Custo estimado: {estimatedCredits} creditos
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {frame ? 'modo imagem' : 'modo texto'} · {aspectRatio}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || frameBusy}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-black uppercase tracking-wide text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {generating ? `${statusLabel[activeStatus] || 'Gerando'}...` : 'Gerar video'}
                </button>

                <p className="text-center text-[10px] font-semibold text-slate-600">
                  A geracao roda na sua conta Magic Hour — os creditos saem direto de la.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="my-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#121215] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                {selected.status === 'complete' ? (
                  <CheckCircle2 size={17} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={17} className="text-orange-400" />
                )}
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  {selected.status === 'complete' ? 'Video pronto' : statusLabel[selected.status] || 'Projeto'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {selected.video_url ? (
                <video
                  src={selected.video_url}
                  controls
                  className={`mx-auto block max-h-[65vh] w-full rounded-2xl border border-white/10 bg-black ${
                    selected.aspect_ratio === '9:16' ? 'max-w-[320px]' : 'max-w-full'
                  }`}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-[#0a0a0c] text-slate-600">
                  <ImagePlus size={30} />
                </div>
              )}

              <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-300">
                {selected.prompt || 'Video a partir de imagem'}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {selected.model} · {selected.resolution} · {selected.duration_seconds}s · {selected.aspect_ratio}
                </span>

                {selected.video_url && (
                  <a
                    href={selected.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-black transition hover:brightness-110"
                  >
                    <Download size={15} /> Baixar video
                  </a>
                )}
              </div>

              <p className="text-[10px] font-semibold text-slate-600">
                Baixe agora: os links dos provedores podem expirar depois de alguns dias.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStudio;
