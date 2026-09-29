import React, { useState } from "react";
import { Cpu, Check, Copy, Sliders, PlayCircle, Eye, Settings, ShieldAlert } from "lucide-react";

export const AiModelGuide: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>("kling");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const modelsData = [
    {
      id: "flow",
      name: "Flow AI",
      badge: "Blindagem Anti-Bloqueio Ativa",
      recommendation: "Otimizado especialmente para passar sem bloqueios na política de pessoas famosas e marcas comerciais.",
      settings: [
        { label: "Política de Segurança", value: "100% livre de nomes próprios, atores ou celebridades (Anti-Policy Violation)" },
        { label: "Duração Recomendada", value: "8s a 10s" },
        { label: "Proporção (Aspect Ratio)", value: "9:16 (Vertical) ou 16:9 (Horizontal)" },
        { label: "Negative Prompt", value: "Obrigatório: bloqueia celebridades, rostos conhecidos e marcas registradas" },
      ],
      promptTemplate:
        "[POLICY COMPLIANCE: 100% FICTIONAL ANONYMOUS CHARACTERS ONLY] + [MANDATORY CHARACTER PHYSIQUE & WEIGHT] + [Anonymous Character Archetype] + [Realistic Action & Environment] + [Camera & Lighting]",
      tips: [
        "O Flow possui um filtro rigoroso contra geração de pessoas famosas. Nosso gerador remove automaticamente qualquer nome próprio (como Raimundo, Seu Tião, Dona Lúcia) do prompt em inglês e substitui por arquétipos ficcionais e anônimos.",
        "Todas as marcas comerciais (Enel, Havaianas, etc.) foram substituídas por descrições genéricas ('rubber flip-flops', 'utility bills').",
        "O negative prompt agora inclui proteções contra 'celebrity, famous person, public figure, recognizable person, actor likeness' para assegurar a aprovação imediata.",
      ],
    },
    {
      id: "kling",
      name: "Kling AI (v1.5 / v2.0)",
      badge: "Mais Recomendado para Vídeos Virais",
      recommendation: "Excelente para física de corpos obesos, suor e sincronia labial em português com LipSync nativo.",
      settings: [
        { label: "Duração Recomendada", value: "10s (para comportar a fala de 9s com folga de 0.5s no início e fim)" },
        { label: "Proporção (Aspect Ratio)", value: "9:16 (Vertical para TikTok/Reels/Shorts) ou 16:9 (Horizontal)" },
        { label: "Modo de Câmera", value: "Custom: Static Medium Shot ou Pan horizontal lento (Speed: 1-2)" },
        { label: "Creativity / Motion", value: "Motion Strength: 4 ou 5 (evita distorção de membros em pessoas grandes)" },
      ],
      promptTemplate:
        "[Sujeito e Anatomia Mórbida] + [Ação e Diálogo] + [Expressão Facial e Suor] + [Cenário Rústico e Detalhes] + [Câmera e Luz 35mm f/2.8]",
      tips: [
        "No Kling, cole o prompt em inglês no campo de geração de vídeo.",
        "Após gerar o vídeo, use a ferramenta de LipSync do Kling enviando a fala de 9 segundos gravada em áudio ou gerada por TTS para sincronizar a boca perfeitamente.",
        "Mantenha o valor de 'Negative Prompt' preenchido para evitar que o modelo tente deixar o corpo magro ou a pele artificial.",
      ],
    },
    {
      id: "runway",
      name: "Runway Gen-3 Alpha",
      badge: "Alta Fidelidade Cinematográfica",
      recommendation: "Ideal para textura de pele fotorrealista, gotas de suor iluminadas por luz tungstênio e desfoque óptico 35mm.",
      settings: [
        { label: "Modo", value: "Text to Video ou Image to Video (recomendado usando o primeiro frame como âncora)" },
        { label: "Duração", value: "10s" },
        { label: "Motion Brush", value: "Ativar sobre braços e boca para fala fluida" },
        { label: "Camera Control", value: "Fixed ou Subtle Handheld drift" },
      ],
      promptTemplate:
        "Cinematic documentary still, eye-level medium shot. [Personagem hiper-obeso com pele suada] speaking animatedly in [Cenário de periferia com paredes descascadas], 35mm lens, raw film grain, f/2.4.",
      tips: [
        "Inicie o prompt com 'Cinematic documentary film still, 35mm raw realism' para afastar o look de comercial limpo.",
        "Descreva o tecido das roupas: 'distressed sweat-soaked cotton tank top with visible tension on seams'.",
      ],
    },
    {
      id: "sora",
      name: "OpenAI Sora / Sora Turbo",
      badge: "Física de Massa e Fluidos Realista",
      recommendation: "Poderoso para simulação de água de chuva, poças de lama vermelha e respingos ao caminhar.",
      settings: [
        { label: "Duração", value: "9s ou 10s" },
        { label: "Resolução", value: "1080p ou 720p vertical (9:16)" },
        { label: "Taxa de Quadros", value: "24fps (para aspecto de cinema documental)" },
      ],
      promptTemplate:
        "Hyper-realistic raw documentary footage captured on 35mm camera. [Ação de 9 segundos de Raimundo e Dona Lúcia] with realistic physics of mud, water droplets, and perspiration.",
      tips: [
        "Sora responde com extrema fidelidade a descrições de tempo: inclua 'Over the course of 9 seconds, the man begins by gesturing... then delivers punchline'.",
      ],
    },
    {
      id: "hailuo",
      name: "Hailuo AI (MiniMax Video-01)",
      badge: "Movimento Corporal Mais Fluido",
      recommendation: "Excelente em evitar membros travados durante movimentos de gesticulação e risadas dos atores.",
      settings: [
        { label: "Duração", value: "6s ou modo estendido" },
        { label: "Prompt Syntax", value: "Descritivo e naturalista, sem tags separadas por vírgula excessiva" },
      ],
      promptTemplate:
        "A large morbidly obese Brazilian man with drenched sweaty skin sitting on an old worn-out sofa in a rustic room, arguing emotionally while holding a glass of soda. The lighting is warm and natural.",
      tips: [
        "Evite excesso de adjetivos abstratos como 'masterpiece'. Foque em substantivos concretos: 'cracked plaster', 'sweaty neck folds', 'CRT television'.",
      ],
    },
    {
      id: "luma",
      name: "Luma Dream Machine",
      badge: "Renderização Rápida e Iluminação Espontânea",
      recommendation: "Ótimo para cenas na chuva e lamaçal com transição de luz natural nublada.",
      settings: [
        { label: "Câmera", value: "Orbit suave ou Static medium" },
        { label: "Enhanced Prompt", value: "Desativar se o Luma tentar embelezar ou afinar os personagens" },
      ],
      promptTemplate:
        "Handheld documentary camera shot of a 280kg Brazilian man in mud, overcast sky, red dirt road, heavy body mass physics, 35mm film.",
      tips: [
        "Desative o 'Enhance Prompt' automático do Luma para impedir que ele adicione palavras de estética luxuosa incompatíveis com a cena periférica.",
      ],
    },
  ];

  const currentModel = modelsData.find((m) => m.id === selectedModel) || modelsData[0];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Cpu className="w-4 h-4" />
          Guia de Renderização nas IAs de Vídeo
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Como Configurar Kling, Runway, Sora, Luma e MiniMax para Vídeos Idênticos
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Cada modelo de IA de vídeo possui particularidades no leitor de prompts. Aqui estão as configurações calibradas para manter a integridade da obesidade dos atores, textura de suor e cenários sem que a IA tente "embelezar" ou estragar a cena.
        </p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {modelsData.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Model Detail Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">{currentModel.name}</h3>
            <p className="text-xs text-amber-400 mt-0.5 font-medium">{currentModel.badge}</p>
          </div>
          <p className="text-xs text-slate-400 max-w-md">{currentModel.recommendation}</p>
        </div>

        {/* Recommended Settings Table */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            Configurações Recomendadas no Painel da IA
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentModel.settings.map((s, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs">
                <span className="text-slate-400 block font-medium mb-0.5">{s.label}</span>
                <span className="text-white font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Template */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Fórmula de Prompt para este Modelo
            </h4>
            <button
              onClick={() => handleCopy(currentModel.promptTemplate, "formula")}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              {copiedKey === "formula" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedKey === "formula" ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 leading-relaxed select-all">
            {currentModel.promptTemplate}
          </div>
        </div>

        {/* Specialist Tips */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Dicas Cruciais do Especialista
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {currentModel.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
