import React, { useState } from 'react';
import { X, Search, Trash2, Clock, FileText, ChevronRight } from 'lucide-react';
import { GeneratedNewsData } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedNewsData[];
  onSelect: (item: GeneratedNewsData) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    (item) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.script?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Histórico de Roteiros
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título ou trecho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">Nenhum roteiro encontrado.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="text-xs font-bold text-slate-200 hover:text-rose-400 cursor-pointer line-clamp-2 leading-snug transition-colors"
                  >
                    {item.title}
                  </h4>
                  <button
                    onClick={() => item.id && onDelete(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {item.script}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                  <span>{item.wordCount} palavras • {item.estimatedDuration}</span>
                  <button
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-sans font-semibold uppercase text-[10px]"
                  >
                    Carregar <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
            <button
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
            </button>
            <span className="text-[10px] text-slate-400">Salvo localmente</span>
          </div>
        )}
      </div>
    </div>
  );
};
