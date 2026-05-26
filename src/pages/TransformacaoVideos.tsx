import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Clipboard,
  Copy,
  Download,
  Hammer,
  Layers,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Scene = {
  sceneNumber: number;
  stepType: string;
  stepLabel: string;
  title: string;
  visualDescription: string;
  asmrAudio: string;
  cameraMovement: string;
  continuity: string;
  optimizedPrompt: string;
};

const draftKey = 'transformacao-videos-draft';

const materialPresets = ['Pneus velhos', 'Tampinhas plásticas', 'Lata de alumínio', 'Pallets de madeira'];
const outcomePresets = ['Mesa lateral', 'Luminária de mesa', 'Vaso escultural', 'Violão acústico'];
const contextPresets = ['Luz natural suave', 'Sombras de fim de tarde', 'Galpão rústico', 'Poeira suspensa'];

const defaultCharacter =
  'Um artesão de mãos firmes e calejadas com roupas simples de trabalho de algodão escuro';

const sceneToText = (scene: Scene) => `CENA ${scene.sceneNumber}: ${scene.title}
Etapa: ${scene.stepLabel} (${scene.stepType})

DESCRIÇÃO VISUAL:
${scene.visualDescription}

ÁUDIO ASMR:
${scene.asmrAudio}

MOVIMENTO DE CÂMERA:
${scene.cameraMovement}

CONTINUIDADE:
${scene.continuity}

PROMPT OTIMIZADO:
${scene.optimizedPrompt}`;

const TransformacaoVideos: React.FC = () => {
  const [customIdea, setCustomIdea] = useState('');
  const [material, setMaterial] = useState('Tampinhas e plástico reciclável');
  const [outcome, setOutcome] = useState('Mesa lateral loft industrial');
  const [customContext, setCustomContext] = useState(
    'Iluminação natural dramática de entardecer com leve fumaça orgânica suspensa no ar',
  );
  const [characterDescription, setCharacterDescription] = useState(defaultCharacter);
  const [promptQuantity, setPromptQuantity] = useState(10);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const activeScene = scenes[selectedScene] || scenes[0];
  const allPrompts = useMemo(
    () => scenes.map((scene) => sceneToText(scene)).join('\n\n--------------------------------------------------\n\n'),
    [scenes],
  );

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      if (typeof draft.customIdea === 'string') setCustomIdea(draft.customIdea);
      if (typeof draft.material === 'string') setMaterial(draft.material);
      if (typeof draft.outcome === 'string') setOutcome(draft.outcome);
      if (typeof draft.customContext === 'string') setCustomContext(draft.customContext);
      if (typeof draft.characterDescription === 'string') setCharacterDescription(draft.characterDescription);
      if (typeof draft.promptQuantity === 'number') setPromptQuantity(Math.min(10, Math.max(2, draft.promptQuantity)));
      if (Array.isArray(draft.scenes)) setScenes(draft.scenes);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        customIdea,
        material,
        outcome,
        customContext,
        characterDescription,
        promptQuantity,
        scenes,
      }),
    );
  }, [customIdea, material, outcome, customContext, characterDescription, promptQuantity, scenes]);

  const copyToClipboard = async (key: string, text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(''), 2000);
  };

  const reset = () => {
    setScenes([]);
    setSelectedScene(0);
    setError('');
    localStorage.removeItem(draftKey);
  };

  const exportMarkdown = () => {
    if (!allPrompts) return;

    const markdown = `# Roteiro Cinematográfico de Transformação

Material original: ${material}
Resultado esperado: ${outcome}
Protagonista: ${characterDescription}

${allPrompts}
`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roteiro-transformacao-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseIdea = async () => {
    if (!customIdea.trim() || parsing) return;
    setParsing(true);
    setError('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Faça login novamente para usar este agente.');

      const response = await fetch('/api/agents/transformacao-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'parse', idea: customIdea }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Não foi possível configurar sua ideia.');

      if (payload.config?.material) setMaterial(payload.config.material);
      if (payload.config?.outcome) setOutcome(payload.config.outcome);
      if (payload.config?.customContext) setCustomContext(payload.config.customContext);
      if (payload.config?.characterDescription) setCharacterDescription(payload.config.characterDescription);
    } catch (err: any) {
      setError(err.message || 'Erro ao configurar a ideia.');
    } finally {
      setParsing(false);
    }
  };

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setScenes([]);
    setSelectedScene(0);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Faça login novamente para usar este agente.');

      const response = await fetch('/api/agents/transformacao-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          customTransformIdea: customIdea,
          material,
          outcome,
          characterDescription,
          customContext,
          promptQuantity,
        }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Não foi possível gerar os prompts.');

      const nextScenes = Array.isArray(payload.scenes) ? payload.scenes : [];
      setScenes(nextScenes);
      setSelectedScene(0);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar roteiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-3 py-6 text-zinc-100 sm:-mx-6 sm:-my-6 sm:px-8 sm:py-10 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-500/20 bg-[#070707] p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <Hammer size={14} />
                Agente de transformação
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                Vídeos de Transformação
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Crie roteiros e prompts cinematográficos para vídeos satisfying de reciclagem, artesanato,
                marcenaria e transformação passo a passo.
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

        <section className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Configuração do roteiro</h2>
            </div>
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
              Documental realista
            </span>
          </div>

          <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                <Sparkles size={15} />
                O que você quer criar?
              </label>
              <span className="text-xs font-bold text-zinc-500">Descreva livremente e a IA preenche os campos.</span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                value={customIdea}
                onChange={(event) => setCustomIdea(event.target.value)}
                rows={3}
                maxLength={900}
                placeholder="Ex: Fabricar um violão acústico rústico usando madeira de pallets descartados em um galpão com luz suave..."
                className="flex-1 rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
              />
              <button
                type="button"
                onClick={parseIdea}
                disabled={parsing || !customIdea.trim()}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-5 text-xs font-black uppercase tracking-wide text-orange-200 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40 md:w-40"
              >
                {parsing ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                {parsing ? 'Lendo...' : 'Configurar IA'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <FieldBlock label="Matéria-prima ou lixo" value={material} onChange={setMaterial} presets={materialPresets} />
            <FieldBlock label="Resultado esperado" value={outcome} onChange={setOutcome} presets={outcomePresets} />
            <FieldBlock label="Atmosfera e iluminação" value={customContext} onChange={setCustomContext} presets={contextPresets} />

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  Quantidade
                </label>
                <span className="text-sm font-black text-white">{promptQuantity} cenas</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={promptQuantity}
                onChange={(event) => setPromptQuantity(Number(event.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="mt-3 grid grid-cols-5 gap-1">
                {[2, 3, 5, 8, 10].map((quantity) => (
                  <button
                    key={quantity}
                    type="button"
                    onClick={() => setPromptQuantity(quantity)}
                    className={`h-8 rounded-lg text-xs font-black ${
                      promptQuantity === quantity
                        ? 'bg-orange-500 text-black'
                        : 'bg-black text-zinc-500 hover:text-white'
                    }`}
                  >
                    {quantity}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Descrição do protagonista
            </label>
            <textarea
              value={characterDescription}
              onChange={(event) => setCharacterDescription(event.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
            />
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold text-zinc-500">
              {scenes.length ? `${scenes.length} de ${promptQuantity} prompts prontos.` : 'Nenhum prompt gerado ainda.'}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {scenes.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('all', allPrompts)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500"
                  >
                    {copiedKey === 'all' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedKey === 'all' ? 'Copiado' : 'Copiar todos'}
                  </button>
                  <button
                    type="button"
                    onClick={exportMarkdown}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500"
                  >
                    <Download size={16} />
                    Exportar
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-xs font-black uppercase tracking-widest text-black shadow-[0_18px_60px_rgba(249,115,22,0.25)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? 'Gerando...' : scenes.length ? 'Regerar tudo' : 'Gerar prompts'}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers size={17} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Sequência</h2>
            </div>

            {scenes.length ? (
              <div className="space-y-2">
                {scenes.map((scene, index) => (
                  <button
                    key={`${scene.sceneNumber}-${scene.title}`}
                    type="button"
                    onClick={() => setSelectedScene(index)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedScene === index
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                      Cena {scene.sceneNumber}
                    </span>
                    <span className="mt-1 block text-sm font-black text-white">{scene.title}</span>
                    <span className="mt-1 block text-xs font-bold text-zinc-500">{scene.stepLabel}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-black p-8 text-center text-sm font-bold text-zinc-500">
                A linha do tempo aparece depois da geração.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5">
            {activeScene ? (
              <article className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                      Cena {activeScene.sceneNumber} • {activeScene.stepLabel}
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">{activeScene.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`scene-${activeScene.sceneNumber}`, sceneToText(activeScene))}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 text-xs font-black uppercase tracking-wide text-orange-100 hover:bg-orange-500/20"
                  >
                    {copiedKey === `scene-${activeScene.sceneNumber}` ? <Check size={15} /> : <Clipboard size={15} />}
                    {copiedKey === `scene-${activeScene.sceneNumber}` ? 'Copiado' : 'Copiar cena'}
                  </button>
                </div>

                <PromptSection title="Descrição visual" text={activeScene.visualDescription} />
                <PromptSection title="Áudio ASMR" text={activeScene.asmrAudio} />
                <PromptSection title="Movimento de câmera" text={activeScene.cameraMovement} />
                <PromptSection title="Continuidade" text={activeScene.continuity} />
                <PromptSection title="Prompt otimizado em inglês" text={activeScene.optimizedPrompt} highlight />
              </article>
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-zinc-800 bg-black p-8 text-center text-sm font-bold text-zinc-500">
                Configure o projeto e clique em Gerar prompts. Os blocos separados aparecerão aqui.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

type FieldBlockProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: string[];
};

const FieldBlock: React.FC<FieldBlockProps> = ({ label, value, onChange, presets }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
    <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-zinc-800 bg-black px-3 text-sm font-bold text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
    />
    <div className="mt-3 flex flex-wrap gap-1.5">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className="rounded-lg bg-black px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-orange-300"
        >
          {preset}
        </button>
      ))}
    </div>
  </div>
);

const PromptSection: React.FC<{ title: string; text: string; highlight?: boolean }> = ({ title, text, highlight }) => (
  <div
    className={`rounded-2xl border p-4 ${
      highlight ? 'border-orange-500/30 bg-orange-500/10' : 'border-zinc-800 bg-zinc-950'
    }`}
  >
    <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.22em] ${highlight ? 'text-orange-300' : 'text-zinc-500'}`}>
      {title}
    </p>
    <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-zinc-200">{text}</p>
  </div>
);

export default TransformacaoVideos;
