import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Film,
  ImageDown,
  Loader2,
  RefreshCw,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';

type ExtractMode = 'interval' | 'total';

type ExtractedFrame = {
  index: number;
  time: number;
  blob: Blob;
  url: string;
};

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds * 10) / 10);
  const minutes = Math.floor(total / 60);
  const rest = (total % 60).toFixed(1);
  return `${String(minutes).padStart(2, '0')}m${rest.padStart(4, '0')}s`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const seekVideo = (video: HTMLVideoElement, time: number) =>
  new Promise<void>((resolve) => {
    const safeTime = Math.min(Math.max(time, 0), Math.max(0, (video.duration || 0) - 0.05));

    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      // pequeno respiro para o navegador pintar o quadro antes de copiar
      window.setTimeout(resolve, 70);
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = safeTime;
  });

const FrameExtractor: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const [mode, setMode] = useState<ExtractMode>('interval');
  const [intervalSeconds, setIntervalSeconds] = useState(1);
  const [totalFrames, setTotalFrames] = useState(20);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState(0.92);

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFrames = () => {
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    setFrames([]);
    setProgress(0);
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;

    if (!selected.type.startsWith('video/')) {
      setError('Escolha um arquivo de video (mp4, webm, mov...).');
      return;
    }

    resetFrames();
    setError('');

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const url = URL.createObjectURL(selected);
    setFile(selected);
    setVideoUrl(url);
    setDuration(0);
    setVideoSize({ width: 0, height: 0 });
  };

  const estimatedFrames = (() => {
    if (!duration) return 0;

    if (mode === 'interval') {
      const step = Math.max(0.1, intervalSeconds);
      return Math.max(1, Math.ceil(duration / step));
    }

    return Math.max(1, Math.min(300, Math.round(totalFrames)));
  })();

  const extract = async () => {
    const video = videoRef.current;

    if (!video || !file) {
      setError('Envie um video primeiro.');
      return;
    }

    if (!duration || Number.isNaN(duration)) {
      setError('Nao consegui ler a duracao do video. Tente outro arquivo.');
      return;
    }

    setExtracting(true);
    setError('');
    resetFrames();

    try {
      const timestamps: number[] = [];

      if (mode === 'interval') {
        const step = Math.max(0.1, intervalSeconds);
        for (let time = 0; time < duration; time += step) {
          timestamps.push(time);
          if (timestamps.length > 400) break;
        }
      } else {
        const count = Math.max(1, Math.min(300, Math.round(totalFrames)));
        for (let index = 0; index < count; index += 1) {
          timestamps.push((duration * index) / count);
        }
      }

      if (!timestamps.length) {
        throw new Error('Nenhum quadro para extrair com essas configuracoes.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Seu navegador nao suporta a extracao de quadros.');
      }

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const collected: ExtractedFrame[] = [];

      for (let index = 0; index < timestamps.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await seekVideo(video, timestamps[index]);

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // eslint-disable-next-line no-await-in-loop
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, mimeType, format === 'png' ? undefined : quality);
        });

        if (blob) {
          collected.push({
            index: index + 1,
            time: timestamps[index],
            blob,
            url: URL.createObjectURL(blob),
          });
        }

        setFrames([...collected]);
        setProgress(Math.round(((index + 1) / timestamps.length) * 100));
      }

      if (!collected.length) {
        throw new Error('Nao consegui extrair nenhum quadro deste video.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao extrair os quadros.');
    } finally {
      setExtracting(false);
    }
  };

  const downloadFrame = (frame: ExtractedFrame) => {
    const extension = format === 'png' ? 'png' : 'jpg';
    const link = document.createElement('a');
    link.href = frame.url;
    link.download = `frame_${String(frame.index).padStart(3, '0')}_${formatTime(frame.time)}.${extension}`;
    link.click();
  };

  const downloadAll = async () => {
    if (!frames.length) return;

    setZipping(true);

    try {
      const zip = new JSZip();
      const extension = format === 'png' ? 'png' : 'jpg';

      frames.forEach((frame) => {
        zip.file(`frame_${String(frame.index).padStart(3, '0')}_${formatTime(frame.time)}.${extension}`, frame.blob);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quadros-${(file?.name || 'video').replace(/\.[^.]+$/, '')}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar o ZIP.');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-950/60">
            <ImageDown size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Extrator de Quadros</h1>
            <p className="mt-1 text-sm text-slate-400">
              Tire fotos de qualquer momento do video. Tudo roda no seu navegador, sem enviar arquivo para servidor.
            </p>
          </div>
        </header>

        {/* Upload */}
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 p-10 text-center transition hover:border-orange-500/60 hover:bg-orange-500/5"
            >
              <Upload size={28} className="text-orange-400" />
              <span className="text-sm font-bold text-slate-200">Clique para escolher o video</span>
              <span className="text-xs text-slate-500">MP4, WebM ou MOV — o arquivo nao sai do seu computador</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Film size={18} className="shrink-0 text-orange-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatBytes(file.size)}
                      {duration > 0 ? ` • ${formatTime(duration)}` : ''}
                      {videoSize.width > 0 ? ` • ${videoSize.width}x${videoSize.height}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetFrames();
                    setFile(null);
                    setVideoUrl('');
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
                >
                  <Trash2 size={14} />
                  Trocar video
                </button>
              </div>

              <video
                ref={videoRef}
                src={videoUrl}
                className="max-h-[320px] w-full rounded-2xl bg-black object-contain"
                controls
                playsInline
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  setDuration(Number.isFinite(video.duration) ? video.duration : 0);
                  setVideoSize({ width: video.videoWidth, height: video.videoHeight });
                }}
              />
            </div>
          )}
        </section>

        {/* Configuracoes */}
        {file && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-2">
              <Settings2 size={17} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Configuracoes</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Como extrair
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('interval')}
                    className={`rounded-xl border p-3 text-left transition ${
                      mode === 'interval'
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Clock size={16} className="mb-1" />
                    <span className="block text-xs font-black">A cada X segundos</span>
                    <span className="block text-[10px] opacity-70">Bom para mapear o video inteiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('total')}
                    className={`rounded-xl border p-3 text-left transition ${
                      mode === 'total'
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <ImageDown size={16} className="mb-1" />
                    <span className="block text-xs font-black">Quantidade fixa</span>
                    <span className="block text-[10px] opacity-70">Espalha N quadros no video</span>
                  </button>
                </div>
              </div>

              <div>
                {mode === 'interval' ? (
                  <>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Intervalo (segundos)
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={intervalSeconds}
                      onChange={(event) => setIntervalSeconds(Number(event.target.value) || 0.1)}
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-bold text-white outline-none focus:border-orange-500"
                    />
                  </>
                ) : (
                  <>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Quantos quadros
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={totalFrames}
                      onChange={(event) => setTotalFrames(Number(event.target.value) || 1)}
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-bold text-white outline-none focus:border-orange-500"
                    />
                  </>
                )}
              </div>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Formato
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'jpeg' as const, label: 'JPG', desc: 'Mais leve' },
                    { id: 'png' as const, label: 'PNG', desc: 'Sem perda' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormat(option.id)}
                      className={`rounded-xl border p-2.5 text-center transition ${
                        format === option.id
                          ? 'border-orange-500 bg-orange-500/10 text-white'
                          : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="block text-xs font-black">{option.label}</span>
                      <span className="block text-[10px] opacity-70">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Qualidade {format === 'jpeg' ? `(${Math.round(quality * 100)}%)` : '(PNG e sempre maxima)'}
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  disabled={format === 'png'}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="w-full accent-orange-500 disabled:opacity-40"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={extract}
                disabled={extracting || !duration}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-black uppercase tracking-wide text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                {extracting ? <Loader2 size={18} className="animate-spin" /> : <ImageDown size={18} />}
                {extracting ? `Extraindo ${progress}%` : 'Extrair quadros'}
              </button>

              <span className="text-xs font-semibold text-slate-400">
                {estimatedFrames > 0 ? `~${estimatedFrames} quadro(s) serao gerados` : 'Carregando informacoes do video...'}
              </span>
            </div>

            {extracting && (
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs font-semibold text-red-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>
        )}

        {/* Resultado */}
        {frames.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <CheckCircle2 size={17} />
                {frames.length} quadro(s) extraido(s)
              </div>

              <button
                type="button"
                onClick={downloadAll}
                disabled={zipping}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {zipping ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {zipping ? 'Gerando ZIP...' : 'Baixar todos (ZIP)'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {frames.map((frame) => (
                <div key={frame.index} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <div className="flex h-44 items-center justify-center bg-black">
                    <img
                      src={frame.url}
                      alt={`Quadro ${frame.index}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-white">#{String(frame.index).padStart(3, '0')}</p>
                      <p className="text-[10px] text-slate-500">{formatTime(frame.time)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadFrame(frame)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      title="Baixar este quadro"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FrameExtractor;