import React, { useState, useRef } from "react";
import { UploadCloud, Image, X, AlertCircle } from "lucide-react";
import { fileToCompressedDataUrl } from "../../../lib/image";

interface UploadZoneProps {
  onImageSelected: (base64: string | null) => void;
  selectedImage: string | null;
  placeholderText?: string;
  compact?: boolean;
  description?: string;
  badgeText?: string;
  aspectRatio?: "square" | "video" | "4/3";
}

export default function UploadZone({ 
  onImageSelected, 
  selectedImage, 
  placeholderText = "Arraste a imagem aqui ou clique para buscar",
  compact = false,
  description = "PNG, JPG ou WEBP (Max 30MB)",
  badgeText,
  aspectRatio
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspectRatio === "4/3" 
    ? "aspect-[4/3]" 
    : aspectRatio === "square" 
    ? "aspect-square" 
    : aspectRatio === "video" 
    ? "aspect-video" 
    : compact 
    ? "aspect-square" 
    : "aspect-video";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG, JPEG, WEBP).");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError("A imagem é muito grande. Escolha uma de até 30MB.");
      return;
    }

    setError(null);

    try {
      const compressed = await fileToCompressedDataUrl(file, 1600, 0.82);
      onImageSelected(compressed);
    } catch {
      setError("Erro ao ler o arquivo de imagem.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full" id="upload-zone-container">
      {selectedImage ? (
        <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm group ${aspectClass}`}>
          <img
            src={selectedImage}
            alt="Preview de referência"
            className="w-full h-full object-cover bg-slate-100"
            referrerPolicy="no-referrer"
          />
          {badgeText && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold rounded-md shadow-xs">
                {badgeText}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={clearSelection}
              className={`p-2 bg-white text-slate-800 rounded-full shadow-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium ${
                compact ? "text-[11px] px-2 py-1" : "text-sm px-2.5 py-1.5"
              }`}
              title="Remover imagem"
              id="clear-image-button"
            >
              <X className="w-3.5 h-3.5" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            compact ? "p-3 min-h-[110px]" : "p-8 min-h-[200px]"
          } ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
          id="dropzone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
          />
          <div className={`bg-white rounded-full shadow-sm border border-slate-100 text-slate-500 ${
            compact ? "p-1.5 mb-1.5" : "p-4 mb-4"
          }`}>
            <UploadCloud className={`${compact ? "w-4 h-4" : "w-8 h-8"} text-slate-400`} />
          </div>
          <p className={`text-slate-800 font-medium ${
            compact ? "text-xs mb-0.5 leading-tight px-1" : "text-sm mb-1"
          }`}>
            {placeholderText}
          </p>
          <p className="text-slate-500 text-[10px]">
            {description}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100" id="upload-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
