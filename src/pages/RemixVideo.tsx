import React, { type ChangeEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Markdown from 'react-markdown';
import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Wand2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_VIDEO_BYTES = 18 * 1024 * 1024;

type CopyButtonProps = {
  id: string;
  text: string;
  label: string;
  primary?: boolean;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CopyButton: React.FC<CopyButtonProps> = ({ id, text, label, primary }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      id={id}
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-black transition active:scale-95 ${
        primary
          ? 'h-12 bg-white px-5 text-sm text-zinc-950 hover:bg-zinc-100'
          : 'h-9 border border-zinc-800 bg-black px-3 text-xs uppercase tracking-wide text-zinc-200 hover:border-orange-500/70 hover:text-orange-300'
      }`}
    >
      {copied ? <Check size={primary ? 18 : 14} className="text-emerald-400" /> : <Copy size={primary ? 18 : 14} />}
      {copied ? 'Copiado' : label}
    </button>
  );
};

const extractBible = (analysis: string) => {
  const match = analysis.match(
    /(?:#\s*BIBLIA DE CONTINUIDADE DOS PERSONAGENS|#\s*BÍBLIA DE CONTINUIDADE DOS PERSONAGENS|B[ií]blia de Continuidade)([\s\S]*?)(?=#\s*CENAS GERADAS|###\s*SEGMENTO:|$)/i
  );

  return match?.[1]?.trim() || '';
};

const splitScenes = (analysis: string) =>
  analysis
    .split(/(?:^|\n)---(?:\n|$)|(?=\n###\s*SEGMENTO:)/)
    .map((scene) => scene.trim())
    .filter((scene) => {
      if (scene.length < 30) return false;
      if (/BIBLIA DE CONTINUIDADE/i.test(scene) && !/SEGMENTO:/i.test(scene)) return false;
      return /SEGMENTO:|Cena\s+\d+|Prompt IA/i.test(scene);
    });

const RemixVideo: React.FC = () => {
  const [video, setVideo] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bible = useMemo(() => extractBible(analysis), [analysis]);
  const scenes = useMemo(() => splitScenes(analysis), [analysis]);

  const handleVideoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Envie um arquivo de video valido.');
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setError('Envie um trecho menor, com ate 18MB. Videos grandes precisam ser cortados antes.');
      return;
    }

    setError('');
    setAnalysis('');
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    setVideo(await readFileAsDataUrl(file));
  };

  const reset = () => {
    setVideo('');
    setFileName('');
    setFileSize('');
    setExtraContext('');
    setAnalysis('');
    setError('');
  };

  const analyze = async () => {
    if (!video) return;

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/remix-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video,
          extraContext,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel analisar o video.');
      }

      setAnalysis(payload.analysis || '');
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="remix-video-page -mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-4 py-8 text-zinc-100 sm:-mx-6 sm:-my-6 sm:px-8 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-500/20 bg-[#070707] p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <Sparkles size={14} />
                Remix de video e audio
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Video Scene Prompter
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Envie um trecho de video e gere prompts por cena, com continuidade de personagens,
                blocos de 8 segundos, falas encaixadas e audio detalhado.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 text-sm font-black text-orange-200 transition hover:bg-orange-500/20"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm font-black text-zinc-200">
                <Video size={17} className="text-orange-300" />
                Video de referencia
              </label>
              {video && (
                <button
                  type="button"
                  onClick={() => {
                    setVideo('');
                    setFileName('');
                    setFileSize('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-300"
                >
                  <Trash2 size={13} />
                  Remover
                </button>
              )}
            </div>

            {video ? (
              <div className="rounded-3xl border border-zinc-800 bg-black p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
                    <Video size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{fileName}</p>
                    <p className="text-xs font-bold text-zinc-500">{fileSize}</p>
                  </div>
                </div>
                <video
                  src={video}
                  className="aspect-video w-full rounded-2xl border border-zinc-800 bg-black object-contain"
                  controls
                />
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-800 bg-black text-zinc-500 transition hover:border-orange-500/60 hover:text-orange-300">
                <Upload className="mb-3" size={34} />
                <span className="text-sm font-black">Enviar video</span>
                <span className="mt-1 text-xs font-semibold">MP4, MOV, WEBM ou AVI ate 18MB</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              </label>
            )}
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-200">
              <FileText size={16} className="text-orange-300" />
              Contexto opcional
            </label>
            <textarea
              value={extraContext}
              onChange={(event) => setExtraContext(event.target.value)}
              rows={8}
              placeholder="Ex: quero recriar esse video em estilo mais cinematografico, mantendo personagens, falas, audio e ritmo..."
              className="custom-scrollbar w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />

            {error && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={analyze}
              disabled={!video || loading}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black uppercase tracking-wide text-zinc-950 shadow-lg transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {loading ? 'Analisando video...' : 'Gerar prompts do video'}
            </button>
          </div>
        </section>

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section className="flex flex-col gap-4 rounded-[2rem] border border-orange-500/20 bg-gradient-to-r from-zinc-950 to-[#15100a] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-300">
                    Analise pronta
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">Prompt completo de producao</h2>
                  <p className="mt-1 text-sm font-semibold text-zinc-400">
                    Copie tudo ou use os blocos separados abaixo.
                  </p>
                </div>
                <CopyButton id="btn-copy-remix-full" text={analysis} label="Copiar tudo" primary />
              </section>

              {bible && (
                <section className="rounded-[1.5rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="flex items-center gap-2 text-base font-black text-white">
                      <FileText size={18} className="text-orange-300" />
                      Biblia de Continuidade
                    </h3>
                    <CopyButton id="btn-copy-remix-bible" text={bible} label="Copiar biblia" />
                  </div>
                  <div className="custom-scrollbar prose prose-invert prose-sm max-w-none rounded-2xl border border-zinc-800 bg-black p-4 text-zinc-300">
                    <Markdown>{bible}</Markdown>
                  </div>
                </section>
              )}

              <section className="rounded-[1.5rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-base font-black text-white">
                    <Sparkles size={18} className="text-orange-300" />
                    Analise completa
                  </h3>
                  <CopyButton id="btn-copy-remix-analysis" text={analysis} label="Copiar markdown" />
                </div>
                <div className="custom-scrollbar prose prose-invert prose-sm max-h-[620px] max-w-none overflow-auto rounded-2xl border border-zinc-800 bg-black p-4 text-zinc-300">
                  <Markdown>{analysis}</Markdown>
                </div>
              </section>

              {scenes.length > 0 && (
                <section className="space-y-4">
                  <h3 className="px-1 text-lg font-black text-white">Cenas individuais</h3>
                  {scenes.map((scene, index) => (
                    <article
                      key={`${index}-${scene.slice(0, 16)}`}
                      className="rounded-[1.5rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6"
                    >
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
                          Cena #{index + 1}
                        </p>
                        <CopyButton id={`btn-copy-remix-scene-${index}`} text={scene} label="Copiar cena" />
                      </div>
                      <div className="custom-scrollbar prose prose-invert prose-sm max-w-none rounded-2xl border border-zinc-800 bg-black p-4 text-zinc-300">
                        <Markdown>{scene}</Markdown>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!analysis && !loading && (
          <section className="rounded-[2rem] border-2 border-dashed border-zinc-800 bg-[#070707] p-10 text-center text-zinc-500">
            <Video className="mx-auto mb-3" size={34} />
            <p className="text-sm font-black uppercase tracking-widest">
              Envie um trecho e transforme em prompt de remake
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default RemixVideo;
