import React from 'react';
import { GeneratedResult } from '../types';
import { X, Trash2, ArrowRight, Clock, Box } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedResult[];
  onSelectResult: (result: GeneratedResult) => void;
  onClearHistory: () => void;
  onDeleteResult: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
  onDeleteResult,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white">Histórico de Campanhas POV</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <Box className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-medium">Nenhum produto gerado ainda.</p>
              <p className="text-xs text-neutral-600">
                Envie uma foto de produto para gerar sua primeira sequência de 3 cenas POV.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition flex items-center gap-3 group relative"
              >
                <div className="w-16 h-16 rounded-lg bg-neutral-900 overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-800">
                  <img
                    src={item.imageUrl}
                    alt={item.productAnalysis.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.productAnalysis.productName}
                  </h4>
                  <span className="text-[10px] text-orange-400 font-medium block truncate">
                    {item.productAnalysis.category}
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {new Date(item.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-neutral-950 transition"
                    title="Carregar Prompts"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteResult(item.id)}
                    className="p-2 rounded-lg hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
