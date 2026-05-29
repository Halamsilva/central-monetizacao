import React, { type ChangeEvent, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Copy,
  History,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Video,
  Clock,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Script = {
  id: number;
  text: string;
  hooks: string[];
};

type Gender = 'homem' | 'mulher';
type VideoLength = '15s' | '25s' | '35s' | '45s' | '60s' | '90s';
type HookStyle =
  | 'espontaneo'
  | 'curiosidade'
  | 'segredo'
  | 'dor_solucao'
  | 'provocativo'
  | 'prova_social';

const triggers = [
  'Curiosidade',
  'Urgência',
  'Escassez',
  'Autoridade',
  'Prova Social',
  'Reciprocidade',
  'Afeição',
  'Exclusividade',
  'Benefício',
];

const suggestions = ['Escova Secadora', 'Fone Bluetooth', 'Mini Geladeira', 'Cinta Modeladora'];

const videoLengths: Array<{ id: VideoLength; label: string; sub: string }> = [
  { id: '15s', label: '15s', sub: 'Ultra rapido' },
  { id: '25s', label: '25s', sub: 'Dinamico' },
  { id: '35s', label: '35s', sub: 'Envolvente' },
  { id: '45s', label: '45s', sub: 'Equilibrado' },
  { id: '60s', label: '60s', sub: 'Detalhado' },
  { id: '90s', label: '90s', sub: 'Completo' },
];

const hookStyles: Array<{ id: HookStyle; label: string; desc: string }> = [
  { id: 'espontaneo', label: 'Amigavel', desc: 'Amiga, olha isso...' },
  { id: 'curiosidade', label: 'Curiosidade', desc: 'Voce nao imagina...' },
  { id: 'segredo', label: 'Segredo', desc: 'Lojistas escondem...' },
  { id: 'dor_solucao', label: 'Dor e solucao', desc: 'Se voce sofre...' },
  { id: 'provocativo', label: 'Alerta', desc: 'Pare de fazer isso...' },
  { id: 'prova_social', label: 'Prova social', desc: 'Todo mundo perguntou...' },
];

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const TikTokShopPersuasivo: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState('');
  const [image, setImage] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender>('mulher');
  const [videoLength, setVideoLength] = useState<VideoLength>('35s');
  const [hookStyle, setHookStyle] = useState<HookStyle>('espontaneo');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const requestAgent = async (body: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error('Faça login novamente para usar este agente.');
    }

    const response = await fetch('/api/agents/tiktok-shop-persuasivo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível concluir a geração.');
    }

    return payload;
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem válida do produto.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem precisa ter até 10MB.');
      return;
    }

    const nextImage = await readImage(file);
    setImage(nextImage);
    setScripts([]);
    setError('');
    setAnalyzing(true);

    try {
      const payload = await requestAgent({ action: 'analyze', image: nextImage });
      if (payload.productName) {
        setProduct(payload.productName);
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível analisar a imagem.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeImage = () => {
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setProduct('');
    setImage('');
    setSelectedTriggers([]);
    setGender('mulher');
    setVideoLength('35s');
    setHookStyle('espontaneo');
    setScripts([]);
    setError('');
    setCopiedId(null);
    setCopiedHookId(null);
    setCopiedAll(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((current) =>
      current.includes(trigger)
        ? current.filter((item) => item !== trigger)
        : [...current, trigger]
    );
  };

  const generateScripts = async () => {
    if (!product.trim() && !image) {
      setError('Digite o nome do produto ou envie uma imagem.');
      return;
    }

    setLoading(true);
    setError('');
    setScripts([]);

    try {
      const payload = await requestAgent({
        action: 'generate',
        product: product.trim(),
        image: image || undefined,
        triggers: selectedTriggers,
        gender,
        videoLength,
        hookStyle,
      });

      const mappedScripts = Array.isArray(payload.scripts)
        ? payload.scripts.map((item: any, index: number) => ({
            id: index,
            text: String(typeof item === 'string' ? item : item?.text || '').trim(),
            hooks: Array.isArray(item?.hooks)
              ? item.hooks.map((hook: unknown) => String(hook || '').trim()).filter(Boolean)
              : [],
          }))
        : [];

      if (!mappedScripts.length) {
        throw new Error('A IA não retornou scripts. Tente novamente.');
      }

      setScripts(mappedScripts);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const copyAll = async () => {
    if (!scripts.length) return;
    await navigator.clipboard.writeText(
      scripts
        .map((script, index) => {
          const hooks = script.hooks.length
            ? `\n\nGanchos alternativos:\n${script.hooks
                .map((hook, hookIndex) => `${hookIndex + 1}. ${hook}`)
                .join('\n')}`
            : '';

          return `Versao ${index + 1}\n${script.text}${hooks}`;
        })
        .join('\n\n---\n\n')
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const copyHookToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedHookId(id);
    setTimeout(() => setCopiedHookId(null), 1800);
  };

  const substituteHook = (scriptId: number, hook: string) => {
    setScripts((current) =>
      current.map((script) => {
        if (script.id !== scriptId) return script;

        const firstSentence = script.text.match(/^[^.!?]+[.!?]/)?.[0];

        if (firstSentence) {
          return {
            ...script,
            text: `${hook.trim()} ${script.text.slice(firstSentence.length).trim()}`,
          };
        }

        const words = script.text.split(' ');

        return {
          ...script,
          text:
            words.length > 6
              ? `${hook.trim()} ${words.slice(6).join(' ').trim()}`
              : `${hook.trim()}. ${script.text}`,
        };
      })
    );
  };

  return (
    <div className="tiktok-persuasive-page -mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-[#f7f4ef] px-4 py-8 text-zinc-950 sm:-mx-6 sm:-my-6 sm:px-8 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-700">
                <ShoppingBag size={14} />
                Agente TikTok Shop
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Scripts Persuasivos
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-500 sm:text-base">
                Gere copies humanizadas para vídeos curtos no estilo achado secreto,
                com gatilhos mentais e chamada para o carrinho laranja.
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

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-1">
              <div className="flex items-center gap-3">
                <ShoppingBag className="ml-4 text-zinc-400" size={20} />
                <input
                  type="text"
                  value={product}
                  disabled={analyzing}
                  onChange={(event) => setProduct(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && generateScripts()}
                  placeholder={analyzing ? 'Identificando produto...' : 'Nome do produto. Ex: Kit 3 Baby Dolls'}
                  className="h-14 min-w-0 flex-1 bg-transparent px-1 text-base font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {!image ? (
              <button
                type="button"
                disabled={analyzing}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 min-w-[128px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 text-sm font-black text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                Foto
              </button>
            ) : (
              <div className="relative h-16 min-w-[128px] overflow-hidden rounded-2xl border border-orange-300 bg-orange-50">
                <img src={image} alt="Produto" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  aria-label="Remover imagem"
                >
                  <X size={14} />
                </button>
                {analyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="animate-spin text-white" size={20} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-black uppercase tracking-widest text-zinc-400">
                Sugestões
              </span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setProduct(suggestion)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={loading || analyzing || (!product.trim() && !image)}
              onClick={generateScripts}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 text-sm font-black text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {loading ? 'Gerando...' : 'Gerar Scripts'}
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
              <Send size={14} className="text-orange-600" />
              Quem está falando?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['mulher', 'homem'] as Gender[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGender(item)}
                  className={`h-12 rounded-xl border text-sm font-black capitalize transition ${
                    gender === item
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  {gender === item && <Check className="mr-1 inline" size={14} />}
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-700">
                <TrendingUp size={14} />
                Alta conversão
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-600">
                Os scripts saem com fala natural, descoberta, benefício, urgência
                e CTA para o carrinho laranja.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                <Video size={14} className="text-orange-600" />
                Tamanho do video
              </p>

              <div className="grid grid-cols-3 gap-2">
                {videoLengths.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVideoLength(item.id)}
                    className={`rounded-xl border px-2 py-2 text-center transition ${
                      videoLength === item.id
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-orange-300'
                    }`}
                  >
                    <span className="block text-xs font-black">{item.label}</span>
                    <span className={`mt-0.5 block text-[9px] font-bold ${
                      videoLength === item.id ? 'text-orange-300' : 'text-zinc-400'
                    }`}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
              <Sparkles size={14} className="text-orange-600" />
              Gatilhos mentais
            </p>
            <div className="flex flex-wrap gap-2">
              {triggers.map((trigger) => (
                <button
                  key={trigger}
                  type="button"
                  onClick={() => toggleTrigger(trigger)}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    selectedTriggers.includes(trigger)
                      ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-orange-300 hover:text-orange-700'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                <Sparkles size={14} className="text-orange-600" />
                Estilo do gancho inicial
              </p>

              <p className="mb-3 text-xs font-semibold text-zinc-400">
                Define a estratégia dos primeiros segundos do video.
              </p>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {hookStyles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setHookStyle(style.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      hookStyle === style.id
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-orange-300 hover:bg-orange-50/40'
                    }`}
                  >
                    <span className="block text-xs font-black">{style.label}</span>
                    <span className={`mt-1 block text-[10px] font-bold ${
                      hookStyle === style.id ? 'text-orange-300' : 'text-zinc-400'
                    }`}>
                      {style.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-[11px] font-bold text-zinc-400">
                <Clock size={14} />
                Tempo selecionado: {videoLength}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-[2rem] border border-zinc-200 bg-white py-16 text-zinc-400"
            >
              <Loader2 className="mb-4 animate-spin text-orange-600" size={36} />
              <p className="text-sm font-black uppercase tracking-widest">
                Criando ganchos persuasivos...
              </p>
            </motion.section>
          ) : scripts.length > 0 ? (
            <section className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-700">
                    Scripts gerados
                  </p>
                  <h2 className="text-3xl font-black">5 versões para gravar</h2>
                </div>
                <button
                  type="button"
                  onClick={copyAll}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-50"
                >
                  {copiedAll ? <Check size={16} /> : <Copy size={16} />}
                  {copiedAll ? 'Copiado' : 'Copiar todos'}
                </button>
              </div>

              {scripts.map((script, index) => (
                <motion.article
                  key={script.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-l-4 border-orange-500 pl-4"
                >
                  <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
                          Versao {String(index + 1).padStart(2, '0')}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-zinc-400">
                          <History size={13} />
                          Estilo humano ativo
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(script.text, script.id)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-xs font-black uppercase tracking-wide text-orange-700 transition hover:bg-orange-100"
                      >
                        {copiedId === script.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === script.id ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>

                    <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed text-zinc-700">
                      {script.text}
                    </p>

                    {script.hooks.length > 0 && (
                      <div className="mt-6 border-t border-zinc-100 pt-5">
                        <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                          <Sparkles size={14} className="text-orange-600" />
                          Ganchos alternativos
                        </p>

                        <div className="grid gap-2">
                          {script.hooks.map((hook, hookIndex) => {
                            const hookKey = `${script.id}-${hookIndex}`;

                            return (
                              <div
                                key={hookKey}
                                className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                              >
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                  Variacao {hookIndex + 1}
                                </p>

                                <p className="mt-1 text-sm font-semibold italic text-zinc-600">
                                  {hook}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => substituteHook(script.id, hook)}
                                    className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-zinc-800"
                                  >
                                    Usar gancho
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => copyHookToClipboard(hook, hookKey)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-black text-zinc-600 transition hover:bg-orange-50 hover:text-orange-700"
                                  >
                                    {copiedHookId === hookKey ? (
                                      <Check size={13} />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                    {copiedHookId === hookKey ? 'Copiado' : 'Copiar'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </section>
          ) : (
            <section className="rounded-[2rem] border border-dashed border-zinc-200 bg-white p-10 text-center text-zinc-400">
              <ImageIcon className="mx-auto mb-3" size={34} />
              <p className="text-sm font-black uppercase tracking-widest">
                Envie um produto e gere scripts prontos para copiar
              </p>
            </section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TikTokShopPersuasivo;
