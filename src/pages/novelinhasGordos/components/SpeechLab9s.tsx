import React, { useState, useEffect, useRef } from "react";
import { Mic, Play, Square, Clock, Sparkles, Check, Copy, AlertCircle, RefreshCw, Volume2 } from "lucide-react";

export const SpeechLab9s: React.FC = () => {
  const [inputText, setInputText] = useState(
    "Mãe, eu não aceito que você chame isso de pobreza não! A gente tem televisão, tem sofá e eu tomei refrigerante hoje! O dinheiro que não tá acompanhando!"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate words and estimated duration
  const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  // Natural Brazilian comedic delivery pacing is approximately 2.3 to 2.6 words per second with pauses
  const estimatedSeconds = words > 0 ? (words / 2.4).toFixed(1) : "0.0";
  const isOptimal = Number(estimatedSeconds) >= 8.5 && Number(estimatedSeconds) <= 9.5;
  const isTooShort = Number(estimatedSeconds) < 8.5;
  const isTooLong = Number(estimatedSeconds) > 9.5;

  const handlePlay = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      stopTimer();
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Seu navegador não suporta sintetizador de voz nativo.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(inputText);
    utterance.lang = "pt-BR";
    utterance.rate = 0.98;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") || v.lang.includes("BR"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    setIsPlaying(true);
    setTimerSeconds(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= 9.0) {
        setTimerSeconds(9.0);
        stopTimer();
      } else {
        setTimerSeconds(Number(elapsed.toFixed(1)));
      }
    }, 100);

    utterance.onend = () => {
      stopTimer();
    };

    utterance.onerror = () => {
      stopTimer();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setTimeout(() => setTimerSeconds(0), 1200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleDialogues = [
    {
      label: "Raimundo e o Sofá",
      text: "Mãe, eu não aceito que você chame isso de pobreza não! A gente tem televisão, tem sofá e eu tomei refrigerante hoje! O dinheiro que não acompanha!",
    },
    {
      label: "Dona Lúcia e a Mesa de Boletos",
      text: "Raimundo, seu padrão de vida tá tão alto que você quer gastar o dinheiro da comida antes mesmo dele chegar na mesa! Olha essas contas de luz atrasadas!",
    },
    {
      label: "Raimundo na Cratera de Lama",
      text: "Disseram que iam arrumar essa rua faz tanto tempo que esse buraco já devia ter até escritura, IPTU e conta de luz própria! Olha essa lagoa!",
    },
    {
      label: "Carla e o Smartphone na Goteira",
      text: "Você comprou um celular com três câmeras enquanto o teto da sala tá caindo e a goteira enchendo o balde! Cria vergonha na cara, Rogério!",
    },
    {
      label: "Raimundo Procurando Emprego",
      text: "Chega de desculpa! Amanhã cedo eu vou procurar serviço de verdade, porque ficar pedindo cinquenta reais pra minha mãe já passou de qualquer limite!",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Clock className="w-4 h-4" />
          Laboratório Métrico de Fala
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Calibrador de Falas de Exatos 9 Segundos (Sincronia Labial)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          IAs de vídeo operam com janelas temporais fixas (como 5s e 9s/10s). Se o texto tiver palavras a mais, o ator é cortado antes de terminar a piada. Se tiver palavras a menos, sobra silêncio estático. Aqui você afina o ritmo exato.
        </p>
      </div>

      {/* Interactive Testing Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              Digite ou Cole a Fala para Testar
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isOptimal
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : isTooShort
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {words} palavras • Estimativa: {estimatedSeconds}s {isOptimal ? "(Perfeito 9s!)" : isTooShort ? "(Curto)" : "(Longo)"}
              </span>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="Digite o diálogo aqui..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors leading-relaxed"
          ></textarea>
        </div>

        {/* Status Analysis Alert */}
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
            isOptimal
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : isTooShort
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {isOptimal ? (
            <span>
              <strong>Perfeito!</strong> Esta fala tem {words} palavras, atingindo a cadência padrão de 9 segundos falados em português com expressividade e respiração natural.
            </span>
          ) : isTooShort ? (
            <span>
              <strong>Dica:</strong> A fala está com ~{estimatedSeconds}s. Adicione mais 3 a 5 palavras de ênfase (ex: 'Olha isso!', 'Deus me livre!', 'Não tem cabimento!') para completar os 9 segundos.
            </span>
          ) : (
            <span>
              <strong>Atenção:</strong> A fala está longa (~{estimatedSeconds}s). Remova 2 a 4 palavras para evitar que o personagem seja cortado bruscamente no segundo 9 do vídeo da IA.
            </span>
          )}
        </div>

        {/* Playback Controls & 9s Timeline Visualizer */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePlay}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                  isPlaying
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Parar Teste de Voz
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Simular Fala de 9 Segundos (Voz PT-BR)
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiada!" : "Copiar"}
              </button>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cronômetro de 9s</div>
                <div className="text-base font-mono font-bold text-amber-400">
                  {timerSeconds.toFixed(1)}s <span className="text-slate-500 font-normal">/ 9.0s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                isPlaying ? "bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 animate-pulse" : "bg-slate-700"
              }`}
              style={{ width: `${(timerSeconds / 9) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0.0s (Início)</span>
            <span>3.0s (Conflito)</span>
            <span>6.0s (Punchline)</span>
            <span>9.0s (Corte do Take)</span>
          </div>
        </div>

        {/* Preset Sample Dialogues */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Exemplos Calibrados dos 4 Vídeos Originais (Clique para Carregar)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sampleDialogues.map((sample, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => setInputText(sample.text)}
                className="text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 transition-all text-xs space-y-1"
              >
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>{sample.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">9.0s</span>
                </div>
                <p className="text-slate-300 line-clamp-2 italic">"{sample.text}"</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
