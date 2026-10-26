import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileAudio,
  Loader2,
  Sparkles,
  Square,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { Mp3Encoder } from '@breezystack/lamejs';
import { supabase } from '../../lib/supabase';

const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 480;
const MAX_MINUTES = 30;
const MAX_FILE_BYTES = 250 * 1024 * 1024;

const LANGUAGES = [
  { id: 'auto', label: 'Detectar automatico' },
  { id: 'pt', label: 'Portugues' },
  { id: 'en', label: 'Ingles' },
  { id: 'es', label: 'Espanhol' },
];

type Segment = { start: number; end: number; text: string };
type Status = 'idle' | 'preparing' | 'transcribing' | 'done';

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

const toSrtTime = (seconds: number) => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const rest = ms % 1000;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(rest).padStart(3, '0')}`;
};

const downloadText = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Transcritor: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; duration: number } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ chunk: 0, total: 0 });
  const [segments, setSegments] = useState<Segment[]>([]);
  const [language, setLanguage] = useState('auto');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const pcmRef = useRef<Float32Array | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    pcmRef.current = null;
    abortRef.current = null;
    cancelRef.current = false;
    setFileInfo(null);
    setStatus('idle');
    setProgress({ chunk: 0, total: 0 });
    setSegments([]);
    setDetectedLanguage('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const prepareAudio = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      setError('Escolha um arquivo de video ou audio (MP4, MOV, MP3, WAV, M4A...).');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('Arquivo muito grande (maximo 250MB).');
      return;
    }

    setStatus('preparing');
    setError('');
    setSegments([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();

      let decoded: AudioBuffer;

      try {
        decoded = await context.decodeAudioData(arrayBuffer);
      } finally {
        context.close().catch(() => undefined);
      }

      if (decoded.duration > MAX_MINUTES * 60) {
        setError(`Video com ${Math.round(decoded.duration / 60)} minutos. O limite e ${MAX_MINUTES} minutos por vez.`);
        setStatus('idle');
        return;
      }

      const targetLength = Math.ceil(decoded.duration * SAMPLE_RATE);
      const offline = new OfflineAudioContext(1, targetLength, SAMPLE_RATE);
      const source = offline.createBufferSource();
      source.buffer = decoded;
      source.connect(offline.destination);
      source.start();

      const rendered = await offline.startRendering();
      pcmRef.current = rendered.getChannelData(0).slice();

      setFileInfo({ name: file.name, size: file.size, duration: decoded.duration });
      setStatus('idle');
    } catch {
      setError('Nao consegui ler o audio desse arquivo. Tente MP4, MOV, MP3 ou WAV (codec AAC/MP3).');
      setStatus('idle');
    }
  };

  const encodeChunk = (pcm: Float32Array) => {
    const samples = new Int16Array(pcm.length);

    for (let i = 0; i < pcm.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, pcm[i]));
      samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    const encoder = new Mp3Encoder(1, SAMPLE_RATE, 32);
    const parts: BlobPart[] = [];
    const blockSize = 1152;

    for (let i = 0; i < samples.length; i += blockSize) {
      const buffer = encoder.encodeBuffer(samples.subarray(i, i + blockSize));
      if (buffer.length) parts.push(buffer as BlobPart);
    }

    const tail = encoder.flush();
    if (tail.length) parts.push(tail as BlobPart);

    return new Blob(parts, { type: 'audio/mpeg' });
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(new Error('Falha ao preparar o audio.'));
      reader.readAsDataURL(blob);
    });

  const transcribe = async () => {
    const pcm = pcmRef.current;

    if (!pcm || !fileInfo) {
      setError('Escolha um arquivo primeiro.');
      return;
    }

    const chunkSamples = SAMPLE_RATE * CHUNK_SECONDS;
    const total = Math.ceil(pcm.length / chunkSamples);

    cancelRef.current = false;
    setStatus('transcribing');
    setError('');
    setSegments([]);
    setProgress({ chunk: 0, total });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';
      const allSegments: Segment[] = [];

      for (let index = 0; index < total; index += 1) {
        if (cancelRef.current) break;

        const slice = pcm.subarray(index * chunkSamples, Math.min((index + 1) * chunkSamples, pcm.length));
        const mp3 = encodeChunk(slice);
        const audioBase64 = await blobToBase64(mp3);

        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch('/api/agents/transcritor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            audioBase64,
            language: language === 'auto' ? '' : language,
            offsetSeconds: index * CHUNK_SECONDS,
          }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || `Falha ao transcrever o trecho ${index + 1}.`);
        }

        const chunkSegments: Segment[] = Array.isArray(data?.segments)
          ? data.segments.map((item: any) => ({
              start: Number(item?.start) || 0,
              end: Number(item?.end) || 0,
              text: String(item?.text || '').trim(),
            }))
          : [];

        allSegments.push(...chunkSegments);
        setSegments([...allSegments]);
        setProgress({ chunk: index + 1, total });

        if (!detectedLanguage && data?.language) setDetectedLanguage(String(data.language));
      }

      if (!cancelRef.current) {
        setStatus('done');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatus('idle');
      } else {
        setError(err?.message || 'Erro ao transcrever.');
        setStatus('idle');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => {
    cancelRef.current = true;
    abortRef.current?.abort();
    setStatus('idle');
  };

  const plainText = segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim();

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard bloqueado
    }
  };

  const downloadSrt = () => {
    const content = segments
      .map((segment, index) => `${index + 1}\n${toSrtTime(segment.start)} --> ${toSrtTime(segment.end)}\n${segment.text}\n`)
      .join('\n');

    downloadText(content, 'transcricao.srt', 'application/x-subrip');
  };

  const busy = status === 'preparing' || status === 'transcribing';
  const percent = progress.total ? Math.round((progress.chunk / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <FileAudio size={24} />
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">Transcritor de Video</h1>
              <p className="text-xs font-semibold text-violet-100 sm:text-sm">
                Transforme video ou audio em texto com timestamps, usando o Whisper da Groq.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide backdrop-blur">
            <Sparkles size={13} /> ate {MAX_MINUTES} min
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) prepareAudio(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            busy ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-slate-50 hover:border-violet-400'
          }`}
        >
          {status === 'preparing' ? (
            <>
              <Loader2 size={28} className="animate-spin text-violet-600" />
              <p className="mt-3 text-sm font-black text-slate-700">Preparando o audio...</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Extraindo e convertendo a trilha sonora</p>
            </>
          ) : fileInfo ? (
            <>
              <FileAudio size={28} className="text-violet-600" />
              <p className="mt-3 max-w-full truncate text-sm font-black text-slate-800">{fileInfo.name}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {formatTime(fileInfo.duration)} · {(fileInfo.size / (1024 * 1024)).toFixed(1)}MB
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Clique para trocar o arquivo
              </p>
            </>
          ) : (
            <>
              <UploadCloud size={30} className="text-violet-600" />
              <p className="mt-3 text-sm font-black text-slate-700">Arraste o video ou audio aqui</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                MP4, MOV, MP3, WAV, M4A · ate 250MB e {MAX_MINUTES} minutos
              </p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) prepareAudio(file);
          }}
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Idioma do audio</label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={busy}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-violet-500"
            >
              {LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {status === 'transcribing' ? (
              <button
                type="button"
                onClick={cancel}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-700"
              >
                <Square size={14} fill="currentColor" /> Parar
              </button>
            ) : (
              <button
                type="button"
                onClick={transcribe}
                disabled={!fileInfo || busy}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                <Wand2 size={16} /> Transcrever
              </button>
            )}
          </div>
        </div>

        {status === 'transcribing' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>
                Transcrevendo trecho {progress.chunk} de {progress.total}...
              </span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] font-semibold text-slate-400">
          Cada aluno precisa ter acesso ativo para transcrever.
        </p>
      </section>

      {(segments.length > 0 || status === 'done') && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800">Transcricao</h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {segments.length} trechos · {formatTime(fileInfo?.duration || 0)}
                {detectedLanguage ? ` · idioma detectado: ${detectedLanguage}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyText}
                disabled={!plainText}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>

              <button
                type="button"
                onClick={() => downloadText(plainText, 'transcricao.txt', 'text/plain;charset=utf-8')}
                disabled={!plainText}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Download size={13} /> TXT
              </button>

              <button
                type="button"
                onClick={downloadSrt}
                disabled={!segments.length}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[11px] font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <Download size={13} /> SRT (legenda)
              </button>

              <button
                type="button"
                onClick={reset}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50"
              >
                Novo arquivo
              </button>
            </div>
          </div>

          <div className="custom-scrollbar mt-4 max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {segments.length === 0 ? (
              <p className="text-xs font-semibold text-slate-500">Nenhuma fala detectada nesse audio.</p>
            ) : (
              segments.map((segment, index) => (
                <div key={`${segment.start}-${index}`} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-violet-600 ring-1 ring-slate-200">
                    {formatTime(segment.start)}
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-slate-700">{segment.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Transcritor;
