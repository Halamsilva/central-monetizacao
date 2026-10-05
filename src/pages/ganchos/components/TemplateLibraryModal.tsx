import React from 'react';
import { X, Play, Copy, Check, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { PRESET_TEMPLATES } from '../data/templates';
import { PresetTemplate } from '../types/prompt';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PresetTemplate) => void;
  onCopyTemplate: (promptText: string) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCopyTemplate,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    onCopyTemplate(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Biblioteca de Prompts Cinematográficos Virais
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estruturas 100% testadas com gancho apelativo de 8 segundos e textura de pele humana real
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {PRESET_TEMPLATES.map(template => (
            <div
              key={template.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {template.category}
                  </span>
                  <span className="text-[10px] font-medium text-amber-400/90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Pele 8K Incluída
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {template.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {template.hookSummary}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(template.id, template.promptText)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Copiar prompt pronto com um clique"
                >
                  {copiedId === template.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors"
                >
                  <span>Carregar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          Você pode editar qualquer modelo ou clicar em Copiar para usá-lo imediatamente em softwares de IA de vídeo/imagem.
        </div>
      </div>
    </div>
  );
};
