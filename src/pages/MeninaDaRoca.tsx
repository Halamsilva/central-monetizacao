import React, { type ChangeEvent, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  Check,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ScenarioKey = 'natural' | 'sensual' | 'urban' | 'beach' | 'custom';

type GeneratedPrompt = {
  id: number;
  mode: ScenarioKey;
  modeLabel: string;
  text: string;
};

const scenarios: Record<ScenarioKey, { label: string; description: string }> = {
  natural: {
    label: 'Tradicional',
    description: 'Conexao rural, fala proxima e video com cara de gravacao real.',
  },
  sensual: {
    label: 'Sensual Brasileira',
    description: 'Charme adulto leve, confianca e presenca sem nudez.',
  },
  urban: {
    label: 'Urbano/Paredao',
    description: 'Atitude, rua, paredao e linguagem de video curto.',
  },
  beach: {
    label: 'Praia Tropical',
    description: 'Visual solar, leve, tropical e natural.',
  },
  custom: {
    label: 'Personalizado',
    description: 'Use seu proprio contexto e direcao criativa.',
  },
};

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const MeninaDaRoca: React.FC = () => {
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [modelDescription, setModelDescription] = useState('');
  const [selectedModes, setSelectedModes] = useState<ScenarioKey[]>(['natural']);
  const [intenseMode, setIntenseMode] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem valida.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem precisa ter ate 10MB.');
      return;
    }

    setError('');
    setSelectedImage(await readImage(file));
  };

  const toggleMode = (key: ScenarioKey) => {
    setSelectedModes((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((mode) => mode !== key);
      }

      return [...current, key];
    });
  };

  const reset = () => {
    setPrompts([]);
    setModelDescription('');
    setSelectedModes(['natural']);
    setIntenseMode(false);
    setCustomScenario('');
    setSelectedImage('');
    setError('');
  };

  const generatePrompts = async () => {
    setLoading(true);
    setError('');
    setPrompts([]);
    setModelDescription('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/menina-da-roca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedModes,
          intenseMode,
          customScenario,
          image: selectedImage || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel gerar os prompts.');
      }

      setModelDescription(payload.modelDescription || '');
      setPrompts(Array.isArray(payload.prompts) ? payload.prompts : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar prompts.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="menina-roca-page -mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-4 py-8 text-slate-100 sm:-mx-6 sm:-my-6 sm:px-8 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-purple-500/20 bg-[#070707] p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-purple-300">
                <Sparkles size={14} />
                VEO3 e SORA
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Menina da Roca
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Gere prompts verticais para videos virais com estetica brasileira,
                rural, urbana ou tropical, prontos para copiar.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 text-sm font-black text-purple-200 transition hover:bg-purple-500/20"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>
        </motion.section>

        <section className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black p-2">
              <span className={`text-sm font-bold ${!intenseMode ? 'text-white' : 'text-zinc-500'}`}>
                Normal
              </span>
              <button
                type="button"
                onClick={() => setIntenseMode(!intenseMode)}
                className={`relative h-8 w-14 rounded-full transition ${intenseMode ? 'bg-purple-600' : 'bg-zinc-700'}`}
                aria-label="Alternar modo intenso"
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    intenseMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-bold ${intenseMode ? 'text-purple-300' : 'text-zinc-500'}`}>
                Modo intenso
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
              const active = selectedModes.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleMode(key)}
                  className={`relative rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-purple-500 bg-purple-500/10 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.14)]'
                      : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {active && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white ring-2 ring-black">
                      <Check size={12} />
                    </span>
                  )}
                  <span className="block text-sm font-black">{scenarios[key].label}</span>
                  <span className="mt-2 block text-xs font-semibold leading-relaxed text-zinc-500">
                    {scenarios[key].description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm font-black text-zinc-200">
                <Camera size={16} className="text-purple-300" />
                Referencia da modelo
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImage('')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-300"
                >
                  <Trash2 size={13} />
                  Remover
                </button>
              )}
            </div>

            {selectedImage ? (
              <label className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-zinc-700 bg-black">
                <img src={selectedImage} alt="Referencia" className="h-full w-full object-contain" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
                    <Upload size={16} />
                    Alterar imagem
                  </span>
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-800 bg-black text-zinc-500 transition hover:border-purple-500/60 hover:text-purple-300">
                <ImageIcon className="mb-3" size={32} />
                <span className="text-sm font-black">Subir foto opcional</span>
                <span className="mt-1 text-xs font-semibold">PNG ou JPG ate 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-200">
              <Video size={16} className="text-purple-300" />
              Cenario personalizado
            </label>
            <textarea
              value={customScenario}
              onChange={(event) => setCustomScenario(event.target.value)}
              rows={8}
              placeholder="Ex: gravacao no quintal ao fim da tarde, fala olhando para camera, clima de segredo que prende a atencao..."
              className="custom-scrollbar w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
            />

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={generatePrompts}
              disabled={loading}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black uppercase tracking-wide text-zinc-950 shadow-lg transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              {loading ? 'Gerando prompts...' : 'Gerar 5 prompts'}
            </button>
          </div>
        </section>

        {modelDescription && (
          <section className="rounded-[2rem] border border-purple-500/20 bg-purple-500/10 p-5 text-sm font-semibold leading-relaxed text-purple-100">
            Referencia identificada: {modelDescription}
          </section>
        )}

        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {prompts.map((prompt, index) => (
              <motion.article
                key={`${prompt.id}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[1.5rem] border border-zinc-800 bg-[#070707] p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300">
                      Prompt #{index + 1} - {prompt.modeLabel}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs font-bold text-zinc-500">
                      <ChevronRight size={13} />
                      VEO3 / SORA - 9:16 vertical
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(prompt.text, index)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-wide text-purple-200 transition hover:bg-purple-500/20"
                  >
                    {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                    {copiedIndex === index ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <pre className="custom-scrollbar max-h-80 whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-black p-4 font-mono text-xs leading-6 text-zinc-300">
                  {prompt.text}
                </pre>
              </motion.article>
            ))}
          </AnimatePresence>

          {!loading && prompts.length === 0 && (
            <section className="rounded-[2rem] border-2 border-dashed border-zinc-800 bg-[#070707] p-10 text-center text-zinc-500">
              <Video className="mx-auto mb-3" size={34} />
              <p className="text-sm font-black uppercase tracking-widest">
                Escolha estilos e gere seus prompts virais
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeninaDaRoca;
