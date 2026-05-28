import React, { useMemo, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import {
  BadgeCheck,
  Download,
  Image as ImageIcon,
  Loader2,
  Palette,
  Play,
  SlidersHorizontal,
  Trash2,
  Type,
  Upload,
  Video,
} from 'lucide-react';

type TemplateConfig = {
  paginaNome: string;
  usuario: string;
  textoTopo: string;
  fundo: string;
  corBorda: string;
  corTexto: string;
  corUsuario: string;
  bordaLateral: boolean;
  bordaLateralEspessura: number;
  videoX: number;
  videoY: number;
  videoLargura: number;
  videoAltura: number;
  videoModo: 'contain' | 'cover';
  videoBorda: number;
  perfilX: number;
  perfilY: number;
  perfilTamanho: number;
  nomeX: number;
  nomeY: number;
  nomeTamanho: number;
  usuarioX: number;
  usuarioY: number;
  usuarioTamanho: number;
  topoX: number;
  topoY: number;
  topoLargura: number;
  topoTamanho: number;
  topoEntrelinhas: number;
  verificado: boolean;
};

type OutputVideo = {
  name: string;
  url: string;
  size: number;
};

type OutputPreset = 'fast' | 'standard';

const canvasWidth = 1080;
const canvasHeight = 1920;

const outputPresets: Record<OutputPreset, {
  label: string;
  description: string;
  width: number;
  height: number;
  bitrate: string;
  preset: string;
}> = {
  fast: {
    label: 'Leve e rapido',
    description: '720x1280, ideal para celular e videos grandes.',
    width: 720,
    height: 1280,
    bitrate: '3500k',
    preset: 'veryfast',
  },
  standard: {
    label: 'Padrao 1080p',
    description: '1080x1920 com mais qualidade, exige mais memoria.',
    width: 1080,
    height: 1920,
    bitrate: '8000k',
    preset: 'medium',
  },
};

const defaultTemplate: TemplateConfig = {
  paginaNome: 'Halam silva',
  usuario: '@halamsilva',
  textoTopo: 'parabens voce encontrou a pagina que so mostra viral',
  fundo: '#FFFFFF',
  corBorda: '#7B2CFF',
  corTexto: '#111111',
  corUsuario: '#B8B8B8',
  bordaLateral: true,
  bordaLateralEspessura: 8,
  videoX: 54,
  videoY: 806,
  videoLargura: 972,
  videoAltura: 999,
  videoModo: 'contain',
  videoBorda: 0,
  perfilX: 105,
  perfilY: 330,
  perfilTamanho: 96,
  nomeX: 247,
  nomeY: 345,
  nomeTamanho: 34,
  usuarioX: 247,
  usuarioY: 390,
  usuarioTamanho: 24,
  topoX: 74,
  topoY: 497,
  topoLargura: 900,
  topoTamanho: 31,
  topoEntrelinhas: 10,
  verificado: true,
};

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const sanitizeName = (name: string) => {
  const clean = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');
  return `${clean || 'video'}_editado.mp4`;
};

const readImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
};

const drawCircleImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  config: TemplateConfig,
  scale: number,
) => {
  const perfilX = config.perfilX * scale;
  const perfilY = config.perfilY * scale;
  const perfilTamanho = config.perfilTamanho * scale;
  context.save();
  context.beginPath();
  context.arc(
    perfilX + perfilTamanho / 2,
    perfilY + perfilTamanho / 2,
    perfilTamanho / 2,
    0,
    Math.PI * 2,
  );
  context.clip();

  if (image) {
    const sourceRatio = image.width / image.height;
    const targetRatio = 1;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceRatio > targetRatio) {
      sw = image.height;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width;
      sy = (image.height - sh) / 2;
    }

    context.drawImage(image, sx, sy, sw, sh, perfilX, perfilY, perfilTamanho, perfilTamanho);
  } else {
    context.fillStyle = config.corBorda;
    context.fillRect(perfilX, perfilY, perfilTamanho, perfilTamanho);
    context.fillStyle = '#FFFFFF';
    context.font = `700 ${Math.max(18, Math.round(perfilTamanho / 3))}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const initials = config.paginaNome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'P';
    context.fillText(initials, perfilX + perfilTamanho / 2, perfilY + perfilTamanho / 2);
  }

  context.restore();
};

const drawVerifiedBadge = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) => {
  context.save();
  context.fillStyle = '#169BF2';
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#FFFFFF';
  context.lineWidth = Math.max(3, size * 0.14);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(x + size * 0.28, y + size * 0.52);
  context.lineTo(x + size * 0.43, y + size * 0.66);
  context.lineTo(x + size * 0.72, y + size * 0.36);
  context.stroke();
  context.restore();
};

const createTemplateBlob = async (
  config: TemplateConfig,
  logoFile: File | null,
  outputWidth: number,
  outputHeight: number,
) => {
  const scale = outputWidth / canvasWidth;
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Nao foi possivel criar o template.');

  context.clearRect(0, 0, outputWidth, outputHeight);
  context.fillStyle = config.fundo;
  context.fillRect(0, 0, outputWidth, outputHeight);

  if (config.bordaLateral) {
    context.fillStyle = config.corBorda;
    const width = config.bordaLateralEspessura * scale;
    context.fillRect(0, 0, width, outputHeight);
    context.fillRect(outputWidth - width, 0, width, outputHeight);
    context.fillRect(0, 0, outputWidth, width);
    context.fillRect(0, outputHeight - width, outputWidth, width);
  }

  context.clearRect(
    config.videoX * scale,
    config.videoY * scale,
    config.videoLargura * scale,
    config.videoAltura * scale,
  );

  if (config.videoBorda > 0) {
    context.strokeStyle = config.corBorda;
    context.lineWidth = config.videoBorda * scale;
    context.strokeRect(
      (config.videoX - config.videoBorda / 2) * scale,
      (config.videoY - config.videoBorda / 2) * scale,
      (config.videoLargura + config.videoBorda) * scale,
      (config.videoAltura + config.videoBorda) * scale,
    );
  }

  const logoImage = logoFile ? await readImage(logoFile) : null;
  drawCircleImage(context, logoImage, config, scale);

  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillStyle = config.corTexto;
  context.font = `700 ${config.nomeTamanho * scale}px Arial`;
  context.fillText(config.paginaNome, config.nomeX * scale, config.nomeY * scale);

  if (config.verificado) {
    const nameWidth = context.measureText(config.paginaNome).width;
    drawVerifiedBadge(context, config.nomeX * scale + nameWidth + 14 * scale, (config.nomeY + 5) * scale, 25 * scale);
  }

  context.fillStyle = config.corUsuario;
  context.font = `500 ${config.usuarioTamanho * scale}px Arial`;
  context.fillText(config.usuario, config.usuarioX * scale, config.usuarioY * scale);

  context.fillStyle = config.corTexto;
  context.font = `700 ${config.topoTamanho * scale}px Arial`;
  let y = config.topoY * scale;
  for (const line of wrapCanvasText(context, config.textoTopo, config.topoLargura * scale)) {
    context.fillText(line, config.topoX * scale, y);
    y += (config.topoTamanho + config.topoEntrelinhas) * scale;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Nao foi possivel exportar o template.'));
    }, 'image/png');
  });
};

const getVideoFilter = (config: TemplateConfig, outputWidth: number, outputHeight: number) => {
  const scale = outputWidth / canvasWidth;
  const videoX = Math.round(config.videoX * scale);
  const videoY = Math.round(config.videoY * scale);
  const videoWidth = Math.round(config.videoLargura * scale);
  const videoHeight = Math.round(config.videoAltura * scale);
  const background = `0x${config.fundo.replace('#', '')}`;
  const fit =
    config.videoModo === 'cover'
      ? `scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=increase,crop=${videoWidth}:${videoHeight}`
      : `scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:color=${background}`;

  return `[0:v]${fit},setsar=1[slot];[slot]pad=${outputWidth}:${outputHeight}:${videoX}:${videoY}:color=${background}[base];[base][1:v]overlay=0:0:format=auto[v]`;
};

const EditorMassaVideos: React.FC = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [config, setConfig] = useState<TemplateConfig>(defaultTemplate);
  const [videos, setVideos] = useState<File[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<OutputVideo[]>([]);
  const [outputPreset, setOutputPreset] = useState<OutputPreset>('fast');
  const [loadingFfmpeg, setLoadingFfmpeg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [logText, setLogText] = useState('');
  const [error, setError] = useState('');

  const previewLogoUrl = useMemo(() => (logo ? URL.createObjectURL(logo) : ''), [logo]);
  const selectedPreset = outputPresets[outputPreset];
  const totalVideoSize = videos.reduce((total, video) => total + video.size, 0);

  const updateConfig = <K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const loadFfmpeg = async () => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;

    setLoadingFfmpeg(true);
    setProgressText('Carregando FFmpeg no navegador...');
    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      setLogText((prev) => `${prev}\n${message}`.slice(-5000));
    });
    ffmpeg.on('progress', ({ progress }) => {
      if (Number.isFinite(progress)) {
        setProgressText(`Processando... ${Math.min(99, Math.round(progress * 100))}%`);
      }
    });

    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    });
    ffmpegRef.current = ffmpeg;
    setLoadingFfmpeg(false);
    return ffmpeg;
  };

  const handleVideos = (files: FileList | null) => {
    if (!files) return;
    const accepted = [...files].filter((file) => file.type.startsWith('video/'));
    setVideos(accepted);
    setOutputs((prev) => {
      prev.forEach((output) => URL.revokeObjectURL(output.url));
      return [];
    });
  };

  const processVideos = async () => {
    if (!videos.length) {
      setError('Envie pelo menos um video.');
      return;
    }

    setError('');
    setLogText('');
    setProcessing(true);

    try {
      const ffmpeg = await loadFfmpeg();
      const templateBlob = await createTemplateBlob(config, logo, selectedPreset.width, selectedPreset.height);
      const nextOutputs: OutputVideo[] = [];

      for (let index = 0; index < videos.length; index += 1) {
        const video = videos[index];
        const inputName = `input-${index}.${video.name.split('.').pop() || 'mp4'}`;
        const templateName = `template-${index}.png`;
        const outputName = `output-${index}.mp4`;

        setProgressText(`Preparando ${index + 1}/${videos.length}: ${video.name}`);
        await ffmpeg.writeFile(inputName, await fetchFile(video));
        await ffmpeg.writeFile(templateName, await fetchFile(templateBlob));

        const exitCode = await ffmpeg.exec([
          '-i',
          inputName,
          '-loop',
          '1',
          '-i',
          templateName,
          '-filter_complex',
          getVideoFilter(config, selectedPreset.width, selectedPreset.height),
          '-map',
          '[v]',
          '-map',
          '0:a?',
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:v',
          selectedPreset.bitrate,
          '-preset',
          selectedPreset.preset,
          '-shortest',
          outputName,
        ]);

        if (exitCode !== 0) {
          throw new Error(`FFmpeg falhou no video ${video.name}.`);
        }

        const data = await ffmpeg.readFile(outputName);
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const blob = new Blob([bytes], { type: 'video/mp4' });
        nextOutputs.push({
          name: sanitizeName(video.name),
          url: URL.createObjectURL(blob),
          size: blob.size,
        });

        await ffmpeg.deleteFile(inputName).catch(() => undefined);
        await ffmpeg.deleteFile(templateName).catch(() => undefined);
        await ffmpeg.deleteFile(outputName).catch(() => undefined);
      }

      setOutputs((prev) => {
        prev.forEach((output) => URL.revokeObjectURL(output.url));
        return nextOutputs;
      });
      setProgressText(`${nextOutputs.length} video(s) pronto(s) para baixar.`);
    } catch (processError: any) {
      setError(processError.message || 'Nao foi possivel processar os videos.');
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    setVideos([]);
    setLogo(null);
    setOutputs((prev) => {
      prev.forEach((output) => URL.revokeObjectURL(output.url));
      return [];
    });
    setLogText('');
    setError('');
    setProgressText('');
  };

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-[#f6f7fb] px-3 py-6 text-slate-950 sm:-mx-6 sm:-my-6 sm:px-8 sm:py-10 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                <Video size={14} />
                Editor em massa
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Editar videos em lote</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">
                Envie varios videos, ajuste logo, nome, @, texto e bordas. O processamento roda no navegador com FFmpeg e entrega MP4 pronto para baixar.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Sem API paga. O video nao sai do computador do aluno.
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              <Upload size={16} />
              Arquivos
            </div>

            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-violet-400 hover:bg-violet-50">
              <Video className="mb-3 text-violet-600" size={34} />
              <span className="text-sm font-black text-slate-900">Enviar videos</span>
              <span className="mt-1 text-xs font-semibold text-slate-500">MP4, MOV, WEBM, MKV e outros formatos comuns</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={(event) => handleVideos(event.target.files)} />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 hover:border-violet-300">
              <ImageIcon className="text-violet-600" size={22} />
              <span className="min-w-0 flex-1 truncate">{logo ? logo.name : 'Enviar logo/foto de perfil'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogo(event.target.files?.[0] || null)} />
            </label>

            {videos.length > 0 && (
              <div className="space-y-2">
                <div className={`rounded-2xl border p-3 text-xs font-bold ${
                  totalVideoSize > 180 * 1024 * 1024
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  Total selecionado: {formatSize(totalVideoSize)}. Para arquivos pesados, use o modo leve.
                </div>
                {videos.map((video) => (
                  <div key={`${video.name}-${video.size}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    <div className="truncate text-slate-900">{video.name}</div>
                    <div>{formatSize(video.size)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={processVideos}
                disabled={processing || loadingFfmpeg || !videos.length}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing || loadingFfmpeg ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Gerar
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={processing}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Trash2 size={17} />
                Limpar
              </button>
            </div>

            {(progressText || error) && (
              <div className={`rounded-2xl border p-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                {error || progressText}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                <SlidersHorizontal size={16} />
                Template
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome da pagina" icon={Type}>
                  <input value={config.paginaNome} onChange={(event) => updateConfig('paginaNome', event.target.value)} className="field" />
                </Field>
                <Field label="@usuario" icon={Type}>
                  <input value={config.usuario} onChange={(event) => updateConfig('usuario', event.target.value)} className="field" />
                </Field>
                <Field label="Texto do topo" icon={Type} wide>
                  <textarea value={config.textoTopo} onChange={(event) => updateConfig('textoTopo', event.target.value)} className="field min-h-24 resize-y" />
                </Field>
                <Field label="Cor da borda" icon={Palette}>
                  <input type="color" value={config.corBorda} onChange={(event) => updateConfig('corBorda', event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" />
                </Field>
                <Field label="Fundo" icon={Palette}>
                  <input type="color" value={config.fundo} onChange={(event) => updateConfig('fundo', event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" />
                </Field>
                <Field label="Modo do video" icon={Video}>
                  <select value={config.videoModo} onChange={(event) => updateConfig('videoModo', event.target.value as TemplateConfig['videoModo'])} className="field">
                    <option value="contain">Caber inteiro</option>
                    <option value="cover">Preencher cortando</option>
                  </select>
                </Field>
                <Field label="Saida" icon={Video}>
                  <select value={outputPreset} onChange={(event) => setOutputPreset(event.target.value as OutputPreset)} className="field">
                    {Object.entries(outputPresets).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.label}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{selectedPreset.description}</p>
                </Field>
                <Field label="Borda do video" icon={SlidersHorizontal}>
                  <input type="number" min={0} max={40} value={config.videoBorda} onChange={(event) => updateConfig('videoBorda', Number(event.target.value))} className="field" />
                </Field>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <NumberField label="Video X" value={config.videoX} onChange={(value) => updateConfig('videoX', value)} />
                <NumberField label="Video Y" value={config.videoY} onChange={(value) => updateConfig('videoY', value)} />
                <NumberField label="Largura" value={config.videoLargura} onChange={(value) => updateConfig('videoLargura', value)} />
                <NumberField label="Altura" value={config.videoAltura} onChange={(value) => updateConfig('videoAltura', value)} />
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={config.verificado} onChange={(event) => updateConfig('verificado', event.target.checked)} className="h-5 w-5 accent-violet-600" />
                <BadgeCheck size={18} className="text-blue-500" />
                Mostrar selo verificado
              </label>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Previa</p>
                <div className="mx-auto aspect-[9/16] max-h-[650px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                  <div className="relative h-full w-full" style={{ background: config.fundo }}>
                    {config.bordaLateral && <div className="absolute inset-0 pointer-events-none" style={{ border: `${Math.max(1, config.bordaLateralEspessura / 8)}px solid ${config.corBorda}` }} />}
                    <div
                      className="absolute flex items-center justify-center overflow-hidden bg-slate-200 text-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-500"
                      style={{
                        left: `${(config.videoX / canvasWidth) * 100}%`,
                        top: `${(config.videoY / canvasHeight) * 100}%`,
                        width: `${(config.videoLargura / canvasWidth) * 100}%`,
                        height: `${(config.videoAltura / canvasHeight) * 100}%`,
                        border: `${Math.max(0, config.videoBorda / 8)}px solid ${config.corBorda}`,
                      }}
                    >
                      Area do video
                    </div>
                    <div
                      className="absolute overflow-hidden rounded-full bg-violet-600"
                      style={{
                        left: `${(config.perfilX / canvasWidth) * 100}%`,
                        top: `${(config.perfilY / canvasHeight) * 100}%`,
                        width: `${(config.perfilTamanho / canvasWidth) * 100}%`,
                        aspectRatio: '1',
                      }}
                    >
                      {previewLogoUrl ? <img src={previewLogoUrl} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div
                      className="absolute truncate font-black"
                      style={{
                        left: `${(config.nomeX / canvasWidth) * 100}%`,
                        top: `${(config.nomeY / canvasHeight) * 100}%`,
                        fontSize: `${Math.max(10, config.nomeTamanho / 4)}px`,
                        color: config.corTexto,
                      }}
                    >
                      {config.paginaNome}
                    </div>
                    <div
                      className="absolute truncate font-bold"
                      style={{
                        left: `${(config.usuarioX / canvasWidth) * 100}%`,
                        top: `${(config.usuarioY / canvasHeight) * 100}%`,
                        fontSize: `${Math.max(9, config.usuarioTamanho / 4)}px`,
                        color: config.corUsuario,
                      }}
                    >
                      {config.usuario}
                    </div>
                    <div
                      className="absolute font-black leading-tight"
                      style={{
                        left: `${(config.topoX / canvasWidth) * 100}%`,
                        top: `${(config.topoY / canvasHeight) * 100}%`,
                        width: `${(config.topoLargura / canvasWidth) * 100}%`,
                        fontSize: `${Math.max(10, config.topoTamanho / 4)}px`,
                        color: config.corTexto,
                      }}
                    >
                      {config.textoTopo}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Videos prontos</p>
                <div className="space-y-3">
                  {outputs.length ? (
                    outputs.map((output) => (
                      <a
                        key={output.url}
                        href={output.url}
                        download={output.name}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 hover:bg-emerald-100"
                      >
                        <span className="min-w-0 truncate">{output.name}</span>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          {formatSize(output.size)}
                          <Download size={16} />
                        </span>
                      </a>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                      Os downloads aparecem aqui depois de gerar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {logText && (
          <pre className="max-h-64 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
            {logText.trim()}
          </pre>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  icon: React.ElementType;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ label, icon: Icon, wide, children }) => (
  <label className={wide ? 'md:col-span-2' : ''}>
    <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      <Icon size={14} />
      {label}
    </span>
    {children}
  </label>
);

const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <label>
    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
    <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="field" />
  </label>
);

export default EditorMassaVideos;
