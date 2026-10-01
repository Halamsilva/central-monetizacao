import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  Flame,
  ArrowRight,
  Clipboard,
  Check,
  RotateCcw,
  Video,
  ExternalLink,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  Tv,
  Users,
  Eye,
  Volume2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  User,
  X
} from "lucide-react";
import { Platform, UgcScene, SavedScript, DefaultProductPreset } from "./types";
import { supabase } from "../../lib/supabase";
import { ProductPresets } from "./components/ProductPresets";

export default function App() {
  // State setup
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [videoStyle, setVideoStyle] = useState<"presenter" | "pov">("presenter");
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [mainBenefit, setMainBenefit] = useState("");

  // Multimodal image states
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [avatarImageFile, setAvatarImageFile] = useState<File | null>(null);
  const [avatarImagePreview, setAvatarImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<UgcScene[] | null>(null);

  // Copy-paste indicator
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Saved scripts history
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState<"builder" | "history">("builder");

  // Initializing history
  useEffect(() => {
    const cached = localStorage.getItem("ugc_viral_scripts");
    if (cached) {
      try {
        setSavedScripts(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached scripts", err);
      }
    }
  }, []);

  // Quick select preset handler
  const handleSelectPreset = (preset: DefaultProductPreset) => {
    setProductName(preset.name);
    setProductDescription(preset.description);
    setMainBenefit(preset.benefit);
  };

  const convertToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        resolve({
          data: base64Data,
          mimeType: file.type,
        });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarImageFile(file);
      if (avatarImagePreview) URL.revokeObjectURL(avatarImagePreview);
      setAvatarImagePreview(URL.createObjectURL(file));
    }
  };

  const removeProductImage = () => {
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImageFile(null);
    setProductImagePreview(null);
  };

  const removeAvatarImage = () => {
    if (avatarImagePreview) {
      URL.revokeObjectURL(avatarImagePreview);
    }
    setAvatarImageFile(null);
    setAvatarImagePreview(null);
  };

  // Analyze product from uploaded picture to pre-fill the form
  const handleAnalyzeProduct = async () => {
    if (!productImageFile) {
      setErrorMessage("Nenhuma imagem de produto encontrada! Por favor, adicione primeiro uma foto real de um produto no campo 'Imagem do Produto Físico' abaixo e tente novamente.");
      return;
    }

    setIsAnalyzingProduct(true);
    setErrorMessage(null);

    try {
      const productImagePayload = await convertToBase64(productImageFile);
      
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch("/api/agents/tiktokShopShopee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "analyze-product",
          productImage: productImagePayload,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ocorreu um erro ao analisar a imagem do produto.");
      }

      setProductName(data.productName || "");
      setProductDescription(data.productDescription || "");
      setMainBenefit(data.mainBenefit || "");
    } catch (err: any) {
      console.error("Erro na análise automática:", err);
      setErrorMessage(err.message || "Erro de conexão ao analisar a imagem.");
    } finally {
      setIsAnalyzingProduct(false);
    }
  };

  // Run generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) {
      setErrorMessage("Por favor, selecione primeiro a plataforma desejada (TikTok Shop ou Shopee).");
      return;
    }
    if (!productName.trim() || !productDescription.trim()) {
      setErrorMessage("Por favor, preencha o nome e a descrição do produto.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let productImagePayload = undefined;
      let avatarImagePayload = undefined;

      if (productImageFile) {
        try {
          productImagePayload = await convertToBase64(productImageFile);
        } catch (err) {
          console.error("Erro ao converter imagem do produto", err);
        }
      }

      if (avatarImageFile) {
        try {
          avatarImagePayload = await convertToBase64(avatarImageFile);
        } catch (err) {
          console.error("Erro ao converter imagem do avatar", err);
        }
      }

      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch("/api/agents/tiktokShopShopee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "generate-prompts",
          platform,
          productName,
          productDescription,
          mainBenefit: mainBenefit.trim() || undefined,
          productImage: productImagePayload,
          avatarImage: avatarImagePayload,
          videoStyle,
          voiceGender,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro desconhecido ao requisitar roteiro.");
      }

      setGeneratedScript(data.scenes);

      // Save to local persistence list
      const newSavedScript: SavedScript = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("pt-BR"),
        productName,
        productDescription,
        mainBenefit,
        platform,
        videoStyle,
        voiceGender,
        scenes: data.scenes,
      };

      const updatedList = [newSavedScript, ...savedScripts];
      setSavedScripts(updatedList);
      localStorage.setItem("ugc_viral_scripts", JSON.stringify(updatedList));

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro de conexão ao servidor. Verifique e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedScript = (id: string) => {
    const filtered = savedScripts.filter((s) => s.id !== id);
    setSavedScripts(filtered);
    localStorage.setItem("ugc_viral_scripts", JSON.stringify(filtered));
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyCombinedScene = (scene: UgcScene, index: number) => {
    const formatted = `CENA ${scene.numero} - ${scene.titulo || ""}\n` +
      `[PROMPT VISUAL]: ${scene.promptVisual}\n` +
      `[FALA DO CRIADOR]: "${scene.fala}"\n` +
      `[SOM AMBIENTE]: ${scene.somAmbiente}`;
    
    navigator.clipboard.writeText(formatted);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFullScript = () => {
    if (!generatedScript) return;
    const formatted = generatedScript
      .map(
        (scene) =>
          `CENA ${scene.numero} - ${scene.titulo}\n` +
          `Objetivo Psicológico: ${scene.objetivoPsicologico}\n` +
          `Prompt Visual Completo: ${scene.promptVisual}\n` +
          `Fala: ${scene.fala}\n` +
          `Som Ambiente: ${scene.somAmbiente}\n`
      )
      .join("\n---\n\n");

    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const resetForm = () => {
    setPlatform(null);
    setVideoStyle("presenter");
    setVoiceGender("female");
    setProductName("");
    setProductDescription("");
    setMainBenefit("");
    removeProductImage();
    removeAvatarImage();
    setGeneratedScript(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-100 selection:text-amber-900 pb-16">
      {/* Top Banner Branding */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm ring-4 ring-amber-500/10">
              <Video className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-neutral-900 uppercase">
                Agente UGC Viral
              </h1>
              <p className="text-[10px] text-neutral-500 font-medium">
                Criador de roteiros persuasivos • TikTok Shop & Shopee
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tab-builder-btn"
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "builder"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Criação
            </button>
            <button
              id="tab-history-btn"
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all relative ${
                activeTab === "history"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Histórico
              {savedScripts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Sub-heading info card */}
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-neutral-900">
              UGC (User Generated Content) Extremamente Natural & Humano
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl">
              Nossa IA escreve prompts de imagem/vídeo extremamente realistas com base no{" "}
              <span className="font-semibold text-neutral-800">Bloco de Realismo Humano</span> (sem filtros digitais, poros visíveis, iluminação comum) de modo a obter aprovação e viralizar sem parecer propaganda tradicional.
            </p>
          </div>
        </div>

        {activeTab === "history" ? (
          /* HISTORY SCREEN */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Histórico de Roteiros Criados</h3>
                <p className="text-xs text-neutral-500">Acesse suas criações antigas salvas localmente neste navegador.</p>
              </div>
              {savedScripts.length > 0 && (
                <button
                  id="clear-all-history"
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja apagar todo o histórico de roteiros?")) {
                      setSavedScripts([]);
                      localStorage.removeItem("ugc_viral_scripts");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Tudo</span>
                </button>
              )}
            </div>

            {savedScripts.length === 0 ? (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                <Bookmark className="w-8 h-8 text-neutral-300 mx-auto" />
                <h4 className="font-bold text-neutral-800 text-sm">Nenhum roteiro salvo ainda</h4>
                <p className="text-xs text-neutral-500">
                  Volte para a aba de "Criação", configure um produto e gere os 4 prompts completos. Eles aparecerão listados aqui de forma automática!
                </p>
                <button
                  id="go-back-builder"
                  type="button"
                  onClick={() => setActiveTab("builder")}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
                >
                  Começar Roteiro UGC
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {savedScripts.map((script) => (
                  <div
                    key={script.id}
                    className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-all flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            script.platform === "shopee"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                          }`}
                        >
                          {script.platform === "shopee" ? "Shopee" : "TikTok Shop"}
                        </span>
                        <span className="text-[10px] text-neutral-400">{script.date}</span>
                      </div>
                      <h4 className="font-bold text-neutral-900 text-base">{script.productName}</h4>
                      <p className="text-xs text-neutral-600 line-clamp-2 max-w-2xl">
                        {script.productDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        id={`load-script-${script.id}`}
                        type="button"
                        onClick={() => {
                          setPlatform(script.platform);
                          setProductName(script.productName);
                          setProductDescription(script.productDescription);
                          setMainBenefit(script.mainBenefit);
                          setVideoStyle(script.videoStyle || "presenter");
                          setVoiceGender(script.voiceGender || "female");
                          setGeneratedScript(script.scenes);
                          setActiveTab("builder");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
                      >
                        Carregar no Estúdio
                      </button>
                      <button
                        id={`delete-script-${script.id}`}
                        type="button"
                        onClick={() => deleteSavedScript(script.id)}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 text-neutral-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* BUILDER SCREEN */
          <div className="space-y-8">
            {/* Step 1: Platforms Prompt Selection - MANDATORY AND HIGHLIGHTED */}
            <div className="bg-white border-2 border-amber-400/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-amber-950 text-[10px] uppercase tracking-widest font-extrabold py-0.5 px-2 rounded">
                      Etapa Obrigatória
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 font-mono">01/03</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
                    "Você deseja os prompts para TikTok Shop ou Shopee?"
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Sua escolha altera instantaneamente o roteiro mental e a Chamada de Ação (CTA) obrigatória no final do vídeo de 32 segundos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Shopee Choice */}
                  <button
                    id="choose-shopee-btn"
                    type="button"
                    onClick={() => {
                      setPlatform("shopee");
                      setErrorMessage(null);
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      platform === "shopee"
                        ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        platform === "shopee" ? "bg-orange-500 text-white" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                        <span>Shopee</span>
                        {platform === "shopee" && (
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Selecionado
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        CTA Final: "Clica no link aqui nos comentários e compre o seu antes que acabe."
                      </p>
                    </div>
                  </button>

                  {/* TikTok Shop Choice */}
                  <button
                    id="choose-tiktok-btn"
                    type="button"
                    onClick={() => {
                      setPlatform("tiktok_shop");
                      setErrorMessage(null);
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      platform === "tiktok_shop"
                        ? "border-neutral-900 bg-neutral-900 text-white ring-2 ring-neutral-900/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-900"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        platform === "tiktok_shop" ? "bg-white text-neutral-950" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-sm flex items-center gap-1.5 ${
                          platform === "tiktok_shop" ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        <span>TikTok Shop</span>
                        {platform === "tiktok_shop" && (
                          <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Selecionado
                          </span>
                        )}
                      </h4>
                      <p
                        className={`text-[11px] mt-1 ${
                          platform === "tiktok_shop" ? "text-neutral-400" : "text-neutral-500"
                        }`}
                      >
                        CTA Final: "Deixei o carrinho laranja aqui no cantinho da tela então corre e compre o seu antes que acabe."
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Recording Style (POV vs Presenter) Option */}
            <div className="bg-white border-2 border-amber-400/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-amber-950 text-[10px] uppercase tracking-widest font-extrabold py-0.5 px-2 rounded">
                      Estilo de Gravação
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 font-mono">02/03</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
                    "Como você deseja demonstrar o produto no roteiro?"
                  </h3>
                  <p className="text-xs text-neutral-500">
                    O estilo determina se a modelo aparece falando ou se o foco fica 100% em primeira pessoa mostrando apenas as mãos manipulando o produto físico.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Presenter Style Choice */}
                  <button
                    id="choose-style-presenter-btn"
                    type="button"
                    onClick={() => {
                      setVideoStyle("presenter");
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      videoStyle === "presenter"
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        videoStyle === "presenter" ? "bg-amber-500 text-white" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                        <span>Estilo Apresentador (Padrão)</span>
                        {videoStyle === "presenter" && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Selecionado
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        A apresentadora/modelo aparece narrando e gravando o vídeo, mostrando as feições do seu rosto e segurando o produto físico.
                      </p>
                    </div>
                  </button>

                  {/* POV Style Choice */}
                  <button
                    id="choose-style-pov-btn"
                    type="button"
                    onClick={() => {
                      setVideoStyle("pov");
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      videoStyle === "pov"
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        videoStyle === "pov" ? "bg-amber-500 text-white" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                        <span>Estilo POV (Somente Mãos)</span>
                        {videoStyle === "pov" && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Selecionado
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        A modelo não aparece. O roteiro simula câmera em primeira pessoa (ponto de vista), focando de perto somente em suas mãos manipulando o produto.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Visual Divider inside Step 2 */}
                <div className="border-t border-neutral-100/80 my-2 pt-4"></div>

                {/* Sub-section: Narrator Voice Gender choice */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-neutral-900 tracking-tight leading-tight flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      <span>Gênero da Voz do Narrador</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Escolha o gênero da fala narrada. O roteiro usará flexão de gênero gramatical correta (ex: "chocada" para voz feminina ou "chocado" para voz masculina).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Female Voice Speaker */}
                    <button
                      id="choose-voice-female-btn"
                      type="button"
                      onClick={() => {
                        setVoiceGender("female");
                      }}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        voiceGender === "female"
                          ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/10"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          voiceGender === "female" ? "bg-amber-500 text-white" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                          <span>Narradora Mulher</span>
                          {voiceGender === "female" && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              Selecionada
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Fala em formato de relato feminino (ex: atrasada, cansada, sozinha). Excelente para produtos de beleza, casa e moda.
                        </p>
                      </div>
                    </button>

                    {/* Male Voice Speaker */}
                    <button
                      id="choose-voice-male-btn"
                      type="button"
                      onClick={() => {
                        setVoiceGender("male");
                      }}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        voiceGender === "male"
                          ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/10"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          voiceGender === "male" ? "bg-amber-500 text-white" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                          <span>Narrador Homem</span>
                          {voiceGender === "male" && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              Selecionado
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Fala em formato de relato masculino (ex: atrasado, cansado, sozinho). Excelente para tecnologia, ferramentas, carros e esportes.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Product information & Presets */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-900 text-white text-[10px] uppercase tracking-widest font-semibold py-0.5 px-2 rounded">
                    Dados do Produto
                  </span>
                  <span className="text-xs font-semibold text-neutral-500 font-mono">03/03</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Que produto vamos transformar hoje?</h3>
                <p className="text-xs text-neutral-500">
                  Insira o produto físico que deseja vender em formato de vídeo nativo e orgânico.
                </p>
              </div>

              {/* Feed Presets */}
              <ProductPresets onSelectPreset={handleSelectPreset} />

              <form onSubmit={handleGenerate} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="product-name" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Nome do Produto físico *
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      required
                      placeholder="Ex: Garrafa de Hidratação Inteligente"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-50/50 focus:bg-white focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 transition-all outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="main-benefit" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Benefício Principal / Diferencial (Opcional)
                    </label>
                    <input
                      id="main-benefit"
                      type="text"
                      placeholder="Ex: Lembra de beber água por sinal luminoso e não solta gosto de plástico"
                      value={mainBenefit}
                      onChange={(e) => setMainBenefit(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-50/50 focus:bg-white focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="product-description" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Como é esse produto? Como funciona? *
                  </label>
                  <textarea
                    id="product-description"
                    rows={3}
                    required
                    placeholder="Descrição para a inteligência artificial entender o contexto. Ex: Ela avisa de hora em hora mudando de cor, tem bateria recarregável USB que dura 1 mês inteiro e bocal higiênico magnético."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-50/50 focus:bg-white focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 transition-all outline-hidden resize-none"
                  ></textarea>
                </div>

                {/* Imagens de Referência Multimodal Upload Box */}
                <div id="ai-multimodal-analyzer-card" className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>Análise Visual por Inteligência Artificial (Opcional)</span>
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      Envie fotos reais para que o Especialista analise as cores, material e feições do criador para sincronizar os prompts visuais das cenas com extrema precisão.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Imagem do Produto */}
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                        Imagem do Produto Físico
                      </span>
                      {productImagePreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video flex items-center justify-center">
                          <img
                            src={productImagePreview}
                            alt="Preview do produto"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              id="remove-product-image-btn"
                              type="button"
                              onClick={removeProductImage}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110 cursor-pointer shadow-md"
                              title="Remover imagem"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="product-image-upload"
                          className="flex flex-col items-center justify-center border border-dashed border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/50 rounded-lg p-4 cursor-pointer transition-all aspect-video group text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:text-neutral-600 group-hover:scale-110 transition-all mb-2">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-neutral-700">Adicionar Foto do Produto</span>
                          <span className="text-[10px] text-neutral-400 mt-1">Carregar para extrair detalhes visuais</span>
                          <input
                            id="product-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProductImageChange}
                          />
                        </label>
                      )}
                    </div>

                    {/* Imagem do Avatar */}
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                        Imagem do Apresentador (Cabelo/Pele/Estilo)
                      </span>
                      {avatarImagePreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video flex items-center justify-center">
                          <img
                            src={avatarImagePreview}
                            alt="Preview do avatar"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              id="remove-avatar-image-btn"
                              type="button"
                              onClick={removeAvatarImage}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110 cursor-pointer shadow-md"
                              title="Remover imagem"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="avatar-image-upload"
                          className="flex flex-col items-center justify-center border border-dashed border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/50 rounded-lg p-4 cursor-pointer transition-all aspect-video group text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:text-neutral-600 group-hover:scale-110 transition-all mb-2">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-neutral-700">Adicionar Foto do Criador</span>
                          <span className="text-[10px] text-neutral-400 mt-1">Gênero, feições e coesão física</span>
                          <input
                            id="avatar-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {productImagePreview && (
                    <div className="pt-2 border-t border-neutral-200/50 flex justify-center">
                      <button
                        id="analyze-product-btn"
                        type="button"
                        onClick={handleAnalyzeProduct}
                        disabled={isAnalyzingProduct}
                        className="w-full px-5 py-2.5 bg-neutral-800 hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-800 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isAnalyzingProduct ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-white rounded-full animate-spin"></span>
                            <span>Analisando foto e identificando o produto...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>Detectar Produto & Preencher Formulário Automaticamente</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-amber-50/80 text-amber-950 text-xs p-3.5 rounded-lg border border-amber-200 flex flex-col gap-1.5 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 animate-pulse" />
                      <div>
                        {errorMessage.includes("503") || errorMessage.includes("demand") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("status: 503") ? (
                          <>
                            <span className="font-bold block">Alta Demanda Temporária nos Servidores do Google (Gemini)</span>
                            <span className="text-neutral-700 block mt-0.5 leading-relaxed">
                              O sistema está congestionado no momento. Nós tentamos automaticamente por 6 vezes consecutivas com intervalos crescentes, mas as requisições falharam. 
                              <strong className="block mt-1 font-semibold text-neutral-800">Por favor, clique novamente no botão abaixo após alguns segundos para reprocessar sua solicitação!</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold block">Aviso do Sistema</span>
                            <span className="text-neutral-700 block mt-0.5 leading-relaxed">{errorMessage}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  {(productName || productDescription || platform) && (
                    <button
                      id="reset-form-btn"
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Limpar Atuais
                    </button>
                  )}

                  <button
                    id="submit-generate-btn"
                    type="submit"
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all ${
                      isLoading
                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        : !platform
                        ? "bg-amber-400 hover:bg-amber-500 text-amber-950 hover:scale-[1.01]"
                        : "bg-neutral-900 hover:bg-neutral-800 text-white hover:scale-[1.01]"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin"></span>
                        <span>Pesquisando Psicologia do Consumidor...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar Vídeo UGC Viral 32s</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Script Results */}
            {generatedScript && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-100 p-4 rounded-xl border border-neutral-200">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-neutral-800">
                      Roteiro UGC Conectado (4 Cenas de 8s)
                    </h3>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="bg-amber-100 text-amber-950 border border-amber-200 text-[9px] uppercase font-black px-2 py-0.5 rounded-md">
                        {platform === "shopee" ? "Shopee" : "TikTok Shop"}
                      </span>
                      <span className="bg-neutral-200 text-neutral-800 border border-neutral-300 text-[9px] uppercase font-black px-2 py-0.5 rounded-md">
                        {videoStyle === "pov" ? "Estilo POV" : "Estilo Apresentador"}
                      </span>
                      <span className="bg-amber-500 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>{voiceGender === "male" ? "Voz Masculina" : "Voz Feminina"}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    id="copy-full-script-btn"
                    type="button"
                    onClick={handleCopyFullScript}
                    className="flex items-center gap-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors shrink-0"
                  >
                    {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4 text-neutral-500" />}
                    <span>{copiedAll ? "Copiado com sucesso!" : "Copiar Roteiro Completo"}</span>
                  </button>
                </div>


                {/* Prompt Details Cards Grid */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-sm"></span>
                    <span>Explorar Prompts Visuais das Cenas</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {generatedScript.map((scene, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        {/* Card Header styling */}
                        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            CENA {scene.numero} ({scene.numero * 8 - 8}s a {scene.numero * 8}s)
                          </span>
                          <span className="text-neutral-500 text-xs font-medium font-serif italic truncate max-w-xs">{scene.titulo}</span>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 md:p-5 space-y-4 flex-1">
                          {/* Psicologico goal */}
                          <div className="space-y-1 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-800 block">
                              Objetivo Psicológico da Conversão
                            </span>
                            <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                              {scene.objetivoPsicologico}
                            </p>
                          </div>

                          {/* Speaking content */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                                Fala do Criador (Super natural / sem emojis)
                              </span>
                              {(() => {
                                const wordCount = scene.fala ? scene.fala.split(/\s+/).filter(Boolean).length : 0;
                                const estimatedSecs = Math.min(8.0, Math.round((wordCount / 2.3) * 10) / 10);
                                const isIdeal = wordCount <= 20;
                                const isWarning = wordCount > 20 && wordCount <= 24;
                                return (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-widest ${
                                    isIdeal 
                                      ? "bg-emerald-100 text-emerald-800" 
                                      : isWarning 
                                        ? "bg-amber-100 text-amber-800" 
                                        : "bg-rose-100 text-rose-800"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isIdeal ? "bg-emerald-500 animate-pulse" : isWarning ? "bg-amber-500 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
                                    <span>~{estimatedSecs}s ({wordCount} pal.)</span>
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-sm font-bold text-neutral-900 italic bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                              "{scene.fala}"
                            </p>
                            <span className="text-[10px] text-neutral-400 block italic leading-tight text-right px-1">
                              * Velocidade de narração adaptada para durar menos de 8 segundos por cena.
                            </span>
                          </div>

                          {/* Sound effect background */}
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50/50 p-2 rounded">
                            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                            <span><strong className="text-[10px] uppercase font-bold text-neutral-400">Som Ambiente:</strong> {scene.somAmbiente}</span>
                          </div>

                          {/* Combined Prompt and Speech for 1-click comprehensive copy */}
                          <div className="space-y-2.5 bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                <span>Prompt & Fala Conjugados (1 Clique)</span>
                              </span>
                              <button
                                id={`copy-combined-scene-btn-${idx}`}
                                type="button"
                                onClick={() => handleCopyCombinedScene(scene, idx)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Copiar prompt visual e falas juntos"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Clipboard className="w-3.5 h-3.5 text-emerald-100" />
                                    <span>Copiar Tudo</span>
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <div className="text-[11px] text-neutral-800 space-y-2 pt-1.5 font-mono bg-white/95 p-3 rounded-lg border border-neutral-200/60 select-all leading-relaxed whitespace-pre-wrap">
                              <div>
                                <span className="text-[9px] font-bold text-emerald-800 block uppercase tracking-wider">1. Instruções Visuais de Cena:</span>
                                <p className="text-neutral-700 font-mono mt-0.5">{scene.promptVisual}</p>
                              </div>
                              <div className="pt-2 border-t border-neutral-100">
                                <span className="text-[9px] font-bold text-emerald-800 block uppercase tracking-wider">2. Roteiro / Fala Narrada pelo Criador:</span>
                                <p className="text-neutral-900 font-semibold italic font-sans mt-0.5">"{scene.fala}"</p>
                              </div>
                              <div className="pt-1.5 border-t border-neutral-100">
                                <span className="text-[9px] font-bold text-neutral-400 block uppercase tracking-wider">3. Áudio Ambiente:</span>
                                <p className="text-neutral-600 font-sans mt-0.5">{scene.somAmbiente}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
