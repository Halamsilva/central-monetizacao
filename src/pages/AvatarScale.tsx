import React, { useState, useRef } from 'react';
import { Upload, Scale, Copy, CheckCircle2, Loader2, Sparkles, Image as ImageIcon, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { describeHttpError } from '../lib/httpError';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [detectedGenders, setDetectedGenders] = useState<Record<string, string>>({});
  const [genderPreference, setGenderPreference] = useState<'auto' | 'female' | 'male'>('auto');
  const [copied, setCopied] = useState(false);
  const [selectedStage, setSelectedStage] = useState('etapa-1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STAGES = [
    { id: 'etapa-1', label: 'ETAPA 1', title: 'Persona 120kg', desc: 'Avatar com massa corporal elevada' },
    { id: 'etapa-2', label: 'ETAPA 2', title: 'Work-out Mode', desc: 'Avatar treinando focado em perda de peso' },
    { id: 'etapa-3', label: 'ETAPA 3', title: 'Fit Version', desc: 'Avatar magro e com músculos definidos' }
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
      setResults({});
      setDetectedGenders({});
    }
  };

  const generatePrompt = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/avatarScale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ 
          action: 'transform',
          image, 
          stage: selectedStage,
          gender: genderPreference,
          contextPrompt: (selectedStage === 'etapa-2' || selectedStage === 'etapa-3') ? results['etapa-1'] : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(await describeHttpError(response, 'Nao consegui processar a imagem.'));
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`O servidor retornou uma resposta inválida (Status: ${response.status}).`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(prev => ({ ...prev, [selectedStage]: data.result }));
      if (data.detectedGender) {
        setDetectedGenders(prev => ({ ...prev, [selectedStage]: data.detectedGender }));
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Erro ao processar imagem. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resultsList = results[selectedStage] ? results[selectedStage].split('---').map(p => p.trim()).filter(p => p.length > 0) : [];
  const currentDetectedGender = detectedGenders[selectedStage] || (genderPreference === 'female' ? 'Feminino' : genderPreference === 'male' ? 'Masculino' : null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col font-sans"
    >
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Scale className="text-white" size={20} />
            </div>
            <span className="font-bold tracking-tight text-slate-800 uppercase tracking-widest">AVATAR SCALE</span>
          </motion.div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            IA Online
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Input Area */}
        <section className="space-y-6">
          <motion.header
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Variação Física IA</h1>
            <p className="text-slate-500 mt-2 text-sm italic">Mantenha a identidade absoluta enquanto transforma a anatomia.</p>
          </motion.header>

          {/* Stage Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  selectedStage === s.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Gender Preference & Protection */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <User size={13} className="text-indigo-600" />
                <span>Gênero do Avatar</span>
              </div>
              <span className="text-[9px] text-slate-400">Identificação & Vestimenta</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setGenderPreference('auto')}
                className={`py-2 px-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all text-center ${
                  genderPreference === 'auto'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Auto (IA)
              </button>
              <button
                type="button"
                onClick={() => setGenderPreference('female')}
                className={`py-2 px-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all text-center ${
                  genderPreference === 'female'
                    ? 'bg-pink-50 text-pink-700 shadow-sm border border-pink-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Feminino
              </button>
              <button
                type="button"
                onClick={() => setGenderPreference('male')}
                className={`py-2 px-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all text-center ${
                  genderPreference === 'male'
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masculino
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>Proteção ativa: se mulher, veste top esportivo ou maiô (nunca sem camisa).</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">
              {STAGES.find(s => s.id === selectedStage)?.title}
            </h3>
            <p className="text-xs text-slate-600 pl-1">{STAGES.find(s => s.id === selectedStage)?.desc}</p>
            {(selectedStage === 'etapa-2' || selectedStage === 'etapa-3') && results['etapa-1'] && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 py-1 px-2 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-widest inline-flex items-center gap-1"
              >
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Consistência Ativa (Etapa 1 Herdada)
              </motion.div>
            )}
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-indigo-500 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-8 text-center"
          >
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0"
                >
                  <img src={image} className="w-full h-full object-cover" alt="Upload preview" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">Trocar Imagem</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-4 bg-slate-50 rounded-full text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                    <Upload size={32} />
                  </div>
                  <div className="mt-4">
                    <p className="font-bold text-sm text-slate-700 uppercase tracking-wide">Upload Avatar Base</p>
                    <p className="text-xs text-slate-400 mt-1 italic">PNG ou JPG até 20MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePrompt}
            disabled={!image || loading}
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/10 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? 'Processando...' : 
              selectedStage === 'etapa-1' ? 'Gerar Prompt 120kg' : 
              selectedStage === 'etapa-2' ? 'Gerar 3 Prompts Academia' : 
              'Gerar Pack Musculoso'
            }
          </motion.button>
        </section>

        {/* Right: Result Area */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 min-h-[400px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Resultados IA (Upscaled)</h2>
            {currentDetectedGender && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                  currentDetectedGender === 'Feminino'
                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                <ShieldCheck size={12} className={currentDetectedGender === 'Feminino' ? 'text-pink-600' : 'text-blue-600'} />
                <span>{currentDetectedGender === 'Feminino' ? 'Mulher (Proteção Topless Ativa)' : 'Homem'}</span>
              </motion.div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                >
                  <div className="bg-red-500 p-1 rounded-full shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-white leading-none">!</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-900 uppercase tracking-tight">Falha Técnica</p>
                    <p className="text-[11px] text-red-600 mt-1 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}

              {resultsList.length > 0 ? (
                <div className="space-y-4">
                  {resultsList.map((p, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-slate-100 flex items-center justify-between border-b border-slate-200">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Variação {idx + 1}</span>
                        <button 
                          onClick={() => copyToClipboard(p)}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <Copy size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Copiar</span>
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-mono text-slate-600 leading-relaxed italic">
                          {p}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {copied && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <CheckCircle2 size={12} />
                      Copiado para Área de Transferência
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: loading ? [0.4, 0.8, 0.4] : 0.4 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full">
                    {loading ? <Loader2 className="text-indigo-500 animate-spin" /> : <ImageIcon className="text-slate-400" />}
                  </div>
                  <p className="text-xs font-medium text-slate-500 max-w-[200px] mx-auto">
                    {loading ? 'Analisando biotipo e identidade...' : 'Aguardando seleção e upload para converter'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-slate-50 space-y-4"
          >
               <div className="grid grid-cols-2 gap-4">
                 <motion.div 
                   initial={{ x: -10, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   className="flex items-center gap-2"
                 >
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identidade: Lock</p>
                 </motion.div>
                 <motion.div 
                   initial={{ x: -10, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: 0.7 }}
                   className="flex items-center gap-2"
                 >
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">UPSCALE: Ultra</p>
                 </motion.div>
               </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300 italic underline underline-offset-8 decoration-indigo-500/30">Avatar Scale Engine v1.1 Limpa</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Powered by</span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-full border border-indigo-100">GEMINI 3 FLASH AUTO-REFINE</span>
        </div>
      </footer>
    </motion.div>
  );
}
