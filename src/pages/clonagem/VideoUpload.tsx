import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, X, Zap, CheckCircle2, Loader2, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
  isOptimizing?: boolean;
  optimizationProgress?: number;
  uploadProgress?: number;
  uploadStage?: 'uploading' | 'optimizing' | 'analyzing' | null;
  onOptimizeManual?: () => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
  isOptimizing = false,
  optimizationProgress = 0,
  uploadProgress = 0,
  uploadStage = null,
  onOptimizeManual,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const isBusy = disabled || isOptimizing || uploadStage !== null;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
    },
    maxFiles: 1,
    disabled: isBusy,
  });

  const fileSizeMB = selectedFile ? selectedFile.size / (1024 * 1024) : 0;
  const isLarge = fileSizeMB > 20;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer
                flex flex-col items-center justify-center gap-4
                ${isDragActive ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 hover:border-zinc-400 bg-white'}
                ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                <Upload size={30} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-zinc-900">
                  {isDragActive ? 'Solte o vídeo aqui' : 'Arraste um vídeo ou clique para selecionar'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Formatos MP4, MOV, WEBM, AVI • Suporte a vídeos grandes de até 500MB
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-[11px] font-medium text-zinc-600">
                  <HardDrive size={12} className="text-zinc-500" />
                  <span>Envio automático em partes (Chunked) sem limite de 20MB</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0">
                <Video size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{selectedFile.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-zinc-500">{fileSizeMB.toFixed(1)} MB</span>
                  {isLarge ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <HardDrive size={11} />
                      Vídeo Grande • Envio em Partes Ativado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      Tamanho Direto
                    </span>
                  )}
                </div>
              </div>

              {!isBusy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                  title="Remover vídeo"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Live Uploading Progress */}
            {uploadStage === 'uploading' && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-900 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-700" />
                    Enviando vídeo em partes para o servidor...
                  </span>
                  <span className="font-mono font-bold text-blue-900">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                    style={{ width: `${Math.max(5, uploadProgress)}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-800">
                  Transferência em pacotes contínuos (Chunked Upload). Evita limitações de rede e suporta vídeos pesados.
                </p>
              </div>
            )}

            {/* Analyzing Progress */}
            {uploadStage === 'analyzing' && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-zinc-900 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-zinc-900">Vídeo pronto. Processando no Google Gemini...</p>
                  <p className="text-zinc-500 text-[11px]">Extraindo biometria, iluminação, FACS e sincronia labial.</p>
                </div>
              </div>
            )}

            {/* Client-Side Optimization Progress Bar */}
            {isOptimizing && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-zinc-900" />
                    Otimizando vídeo localmente...
                  </span>
                  <span className="font-mono font-bold text-zinc-700">{optimizationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 transition-all duration-200 rounded-full"
                    style={{ width: `${Math.max(5, optimizationProgress)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Optional manual optimize trigger for users who want faster upload bandwidth */}
            {isLarge && !isOptimizing && !uploadStage && !disabled && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Vídeo pronto para envio em partes
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    O vídeo será processado diretamente pela IA. Você também pode comprimir se desejar economizar dados.
                  </p>
                </div>
                {onOptimizeManual && (
                  <button
                    onClick={onOptimizeManual}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium rounded-lg shadow-sm transition-all text-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Zap size={13} />
                    Comprimir Vídeo (Opcional)
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
