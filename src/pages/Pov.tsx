import React, { type ChangeEvent, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clipboard,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Upload,
  Video,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type VoiceGender = 'Masculina' | 'Feminina';
type VideoStyle = 'Atendente' | 'POV';

type VideoPrompt = {
  id: number;
  title: string;
  scene: string;
  visualPrompt: string;
  speech: string;
  psychologicalTrigger: string;
  voiceGender: VoiceGender;
};

type GenerationResult = {
  productName: string;
  productAnalysis: string;
  prompts: VideoPrompt[];
};

const scenarios = [
  'Loja de varejo movimentada',
  'Boutique premium minimalista',
  'Galpao logistico com pedidos',
  'Estudio clean com foco no produto',
  'Casa brasileira em uso real',
  'Fabrica de producao',
  'Personalizado',
];

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const splitBase64 = (dataUrl: string) => dataUrl.split(',')[1] || '';

const fullPromptText = (prompt: VideoPrompt) =>
  `
Titulo: ${prompt.title}
Cena: ${prompt.scene}
Gatilho: ${prompt.psychologicalTrigger}
Voz: ${prompt.voiceGender}

Prompt visual:
${prompt.visualPrompt}

Fala:
"${prompt.speech}"
`.trim();

const Pov: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [avatarImage, setAvatarImage] = useState('');
  const [avatarMimeType, setAvatarMimeType] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [salesCopy, setSalesCopy] = useState('');
  const [scenario, setScenario] = useState(scenarios[0]);
  const [customScenario, setCustomScenario] = useState('');
  const [charactersClothing, setCharactersClothing] = useState('');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('Atendente');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('Feminina');
  const [avatarGender, setAvatarGender] = useState('Mulher');
  const [avatarClothing, setAvatarClothing] = useState('');
  const [avatarCharacteristics, setAvatarCharacteristics] = useState('');
  const [numScenes, setNumScenes] = useState(5);
  const [includeHook, setIncludeHook] = useState(false);
  const [hookAction, setHookAction] = useState('');
  const [hookSpeech, setHookSpeech] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem valida do produto.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem precisa ter ate 10MB.');
      return;
    }

    setError('');
    setResult(null);
    setMimeType(file.type);
    setImage(await readImage(file));
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem valida do avatar.');
      return;
    }

    setAvatarMimeType(file.type);
    setAvatarImage(await readImage(file));
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const copyAll = async () => {
    if (!result?.prompts.length) return;
    await copyText(result.prompts.map(fullPromptText).join('\n\n---\n\n'), 'all');
  };

  const reset = () => {
    setImage('');
    setMimeType('');
    setAvatarImage('');
    setAvatarMimeType('');
    setCustomProductName('');
    setSalesCopy('');
    setScenario(scenarios[0]);
    setCustomScenario('');
    setCharactersClothing('');
    setVideoStyle('Atendente');
    setVoiceGender('Feminina');
    setAvatarGender('Mulher');
    setAvatarClothing('');
    setAvatarCharacteristics('');
    setNumScenes(5);
    setIncludeHook(false);
    setHookAction('');
    setHookSpeech('');
    setResult(null);
    setError('');
  };

  const generate = async () => {
    if (!image) {
      setError('Envie a foto do produto antes de gerar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/pov', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64Image: splitBase64(image),
          mimeType,
          customProductName,
          salesCopy,
          scenario: scenario === 'Personalizado' ? customScenario : scenario,
          charactersClothing,
          videoStyle,
          voiceGender,
          avatarGender,
          avatarClothing,
          avatarCharacteristics,
          avatarImage:
            avatarImage && videoStyle === 'Atendente'
              ? { data: splitBase64(avatarImage), mimeType: avatarMimeType }
              : undefined,
          numScenes,
          includeHook,
          hookAction,
          hookSpeech,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel gerar os prompts.');
      }

      setResult(payload);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar prompts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pov-page -mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-[#f7f4ef] px-4 py-8 text-zinc-950 sm:-mx-6 sm:-my-6 sm:px-8 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-700">
                <ShoppingBag size={14} />
                Agente POV de vendas
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Retail Prompts
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-500 sm:text-base">
                Envie uma foto do produto e gere prompts ultra-realistas para
                videos de venda, com cenas separadas e prontas para copiar.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition hover:bg-orange-100"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition ${
                image
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-zinc-300 bg-zinc-50 hover:border-orange-400'
              }`}
            >
              {image ? (
                <img src={image} alt="Produto" className="h-full w-full object-contain" />
              ) : (
                <>
                  <Upload className="mb-3 text-zinc-400" size={34} />
                  <span className="text-sm font-black text-zinc-700">
                    Enviar foto do produto
                  </span>
                  <span className="mt-1 text-xs font-semibold text-zinc-400">
                    PNG ou JPG ate 10MB
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <input
              value={customProductName}
              onChange={(event) => setCustomProductName(event.target.value)}
              placeholder="Nome do produto (opcional)"
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            <textarea
              value={salesCopy}
              onChange={(event) => setSalesCopy(event.target.value)}
              rows={4}
              placeholder="Copy de vendas, beneficios ou promessas do produto"
              className="w-full resize-y rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold leading-relaxed outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Cenario
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {scenarios.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScenario(item)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition ${
                      scenario === item
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {scenario === 'Personalizado' && (
                <input
                  value={customScenario}
                  onChange={(event) => setCustomScenario(event.target.value)}
                  placeholder="Descreva o cenario"
                  className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
                />
              )}
            </div>
          </div>

          <div className="space-y-5 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {(['Atendente', 'POV'] as VideoStyle[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setVideoStyle(item)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    videoStyle === item
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  <p className="text-sm font-black">
                    {item === 'POV' ? 'Estilo POV' : 'Com atendente'}
                  </p>
                  <p className="mt-1 text-xs font-semibold opacity-70">
                    {item === 'POV' ? 'Maos + narracao' : 'Avatar apresentando'}
                  </p>
                </button>
              ))}
            </div>

            {videoStyle === 'POV' ? (
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Voz da narracao
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Feminina', 'Masculina'] as VoiceGender[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVoiceGender(item)}
                      className={`h-11 rounded-xl border text-sm font-black ${
                        voiceGender === item
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-zinc-200 text-zinc-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-sm font-black text-zinc-400 transition hover:border-orange-300"
                >
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <ImageIcon size={18} />
                      Foto do atendente (opcional)
                    </span>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                <div className="grid grid-cols-2 gap-2">
                  {['Mulher', 'Homem'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAvatarGender(item)}
                      className={`h-11 rounded-xl border text-sm font-black ${
                        avatarGender === item
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-zinc-200 text-zinc-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={avatarClothing}
                    onChange={(event) => setAvatarClothing(event.target.value)}
                    placeholder="Roupa do atendente"
                    className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
                  />
                  <input
                    value={avatarCharacteristics}
                    onChange={(event) => setAvatarCharacteristics(event.target.value)}
                    placeholder="Caracteristicas"
                    className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            )}

            <input
              value={charactersClothing}
              onChange={(event) => setCharactersClothing(event.target.value)}
              placeholder="Figurino geral dos personagens"
              className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
            />

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Quantidade de cenas
                </label>
                <span className="text-2xl font-black text-orange-600">{numScenes}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={numScenes}
                onChange={(event) => setNumScenes(Number(event.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="text-sm font-black text-zinc-700">
                  Incluir prompt de gancho
                </span>
                <input
                  type="checkbox"
                  checked={includeHook}
                  onChange={(event) => setIncludeHook(event.target.checked)}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
              {includeHook && (
                <div className="mt-3 grid gap-2">
                  <input
                    value={hookAction}
                    onChange={(event) => setHookAction(event.target.value)}
                    placeholder="Acao do gancho"
                    className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
                  />
                  <input
                    value={hookSpeech}
                    onChange={(event) => setHookSpeech(event.target.value)}
                    placeholder="Fala do gancho"
                    className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-orange-400"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={generate}
              disabled={loading || !image}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {loading ? 'Gerando prompts...' : `Gerar ${numScenes} prompts`}
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-700">
                  Produto identificado
                </p>
                <h2 className="text-3xl font-black">{result.productName}</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500">
                  {result.productAnalysis}
                </p>
              </div>
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-50"
              >
                {copied === 'all' ? <Check size={16} /> : <Clipboard size={16} />}
                {copied === 'all' ? 'Copiado' : 'Copiar todos'}
              </button>
            </div>

            <div className="space-y-5">
              {result.prompts.map((prompt, index) => (
                <motion.article
                  key={`${prompt.id}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-l-4 border-orange-500 pl-4"
                >
                  <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">
                          Prompt cena {String(prompt.id).padStart(2, '0')}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-zinc-950">
                          {prompt.title || `Cena ${index + 1}`}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-zinc-400">
                          {prompt.psychologicalTrigger} / Voz {prompt.voiceGender}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(fullPromptText(prompt), `prompt-${index}`)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-xs font-black uppercase tracking-wide text-orange-700 transition hover:bg-orange-100"
                      >
                        {copied === `prompt-${index}` ? <Check size={14} /> : <Clipboard size={14} />}
                        {copied === `prompt-${index}` ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>

                    <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm font-bold italic leading-relaxed text-zinc-800">
                      "{prompt.speech}"
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                        <Video size={13} />
                        Instrucoes visuais
                      </p>
                      <p className="mb-4 text-sm font-semibold leading-relaxed text-zinc-600">
                        {prompt.scene}
                      </p>
                      <pre className="custom-scrollbar max-h-80 whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs leading-6 text-zinc-800">
                        {prompt.visualPrompt}
                      </pre>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Pov;
