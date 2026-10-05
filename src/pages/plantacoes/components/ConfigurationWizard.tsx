import { CHARACTER_OPTIONS, SETTING_OPTIONS } from "../data";
import { CharacterType, SettingType } from "../types";
import { User, MapPin, Sparkles, Sliders, ChevronRight } from "lucide-react";
import { fileToCompressedDataUrl } from "../../../lib/image";

interface ConfigurationWizardProps {
  theme: string;
  characterType: CharacterType;
  settingType: SettingType;
  onChangeCharacter: (type: CharacterType) => void;
  onChangeSetting: (type: SettingType) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  avatarImage: string | null;
  onChangeAvatar: (avatar: string | null) => void;
}

export default function ConfigurationWizard({
  theme,
  characterType,
  settingType,
  onChangeCharacter,
  onChangeSetting,
  onSubmit,
  onBack,
  loading,
  avatarImage,
  onChangeAvatar,
}: ConfigurationWizardProps) {
  return (
    <div id="config-wizard-container" className="max-w-3xl mx-auto space-y-8">
      {/* Selection Summary Breadcrumb banner */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            Tema Selecionado
          </span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{theme}</h3>
        </div>
        <button
          id="change-theme-btn"
          onClick={onBack}
          type="button"
          className="text-xs text-emerald-700 font-semibold hover:underline bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm cursor-pointer hover:bg-emerald-50"
        >
          Alterar Cultivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Character Consistent Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-sans font-bold text-gray-800 text-sm">
              Personagem Fixo (Consistência)
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Este personagem apresentará o mesmo semblante, roupa humilde e voz genuína em todas as 4 cenas. Se subir seu avatar, ele será utilizado no lugar destas escolhas.
          </p>

          {/* CUSTOM USER AVATAR UPLOAD */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Avatar Personalizado (AI Multimodal)
                </h4>
              </div>
              {avatarImage && (
                <button
                  onClick={() => onChangeAvatar(null)}
                  type="button"
                  className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt="Avatar selecionado"
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1">
                <label className="inline-block px-3 py-1.5 bg-white text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs hover:bg-emerald-50/30 transition-colors">
                  {avatarImage ? "Alterar Avatar" : "Subir Foto do Meu Avatar"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await fileToCompressedDataUrl(file, 1024, 0.85);
                        onChangeAvatar(compressed);
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onChangeAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <span className="block text-[9px] text-slate-400 mt-0.5">
                  Extensões aceitas: JPG, PNG, WEBP.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {avatarImage && (
              <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-medium text-center">
                ✨ Seu avatar personalizado está ativado e substituirá as opções abaixo!
              </p>
            )}

            <div className={`space-y-2.5 transition-opacity duration-300 ${avatarImage ? "opacity-45 pointer-events-none" : ""}`}>
              {CHARACTER_OPTIONS.map((opt) => {
                const isSelected = characterType === opt.id;
                return (
                  <button
                    id={`char-option-${opt.id}`}
                    key={opt.id}
                    onClick={() => onChangeCharacter(opt.id as CharacterType)}
                    type="button"
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer flex gap-3 items-center ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={opt.image}
                      alt={opt.label}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100"
                    />
                    <div className="space-y-0.5 flex-1">
                      <h4 className="font-bold text-gray-900">{opt.label}</h4>
                      <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Setting Consistent Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="font-sans font-bold text-gray-800 text-sm">
              Cenário Fixo (Consistência)
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            A ambientação documental de smartphone se manterá intacta para passar sentimento de veracidade.
          </p>
          <div className="space-y-2.5">
            {SETTING_OPTIONS.map((opt) => {
              const isSelected = settingType === opt.id;
              return (
                <button
                  id={`setting-option-${opt.id}`}
                  key={opt.id}
                  onClick={() => onChangeSetting(opt.id as SettingType)}
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">{opt.label}</h4>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realism Mandates check-off */}
      <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wide">Configurações de Realismo Documental</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Falas de 8s (Conversacional)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Estilo Câmera Celular Comum
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Textura de Pele Real
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Luz Natural e Terra Real
          </div>
        </div>
      </div>

      {/* Button to Generate Storyboard */}
      <div className="pt-4 text-center">
        <button
          id="generate-script-btn"
          onClick={onSubmit}
          disabled={loading}
          className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-xl group bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-emerald-200 disabled:opacity-75 cursor-pointer w-full sm:w-auto"
        >
          <span className="relative px-8 py-3.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-xl group-hover:bg-opacity-0 text-emerald-950 dark:text-emerald-50 group-hover:text-white font-semibold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 group-hover:text-white" />
            {loading ? "Sincronizando com Gênio da Horta..." : "Gerar Roteiro Conectado"}
            {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
          </span>
        </button>
      </div>
    </div>
  );
}
