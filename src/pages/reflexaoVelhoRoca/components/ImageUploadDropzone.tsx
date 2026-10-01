import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, Check, AlertCircle } from 'lucide-react';

interface ImageUploadDropzoneProps {
  id: string;
  label: string;
  sublabel: string;
  currentImageUrl?: string;
  descriptionPlaceholder?: string;
  descriptionValue?: string;
  onDescriptionChange?: (val: string) => void;
  onImageChange: (base64Url: string | undefined) => void;
  aspectRatioLabel?: string;
  defaultImageFallbackUrl?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  id,
  label,
  sublabel,
  currentImageUrl,
  descriptionPlaceholder,
  descriptionValue,
  onDescriptionChange,
  onImageChange,
  aspectRatioLabel = "Recomendado 9:16 ou 1:1",
  defaultImageFallbackUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor envie um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    // Limit to 10MB to keep browser memory clean
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter menos de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageChange(result);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler a imagem. Tente outro arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#140e09] border border-[#2e1f14] space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-[#faf3e8] uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#e08244]" />
            <span>{label}</span>
          </h4>
          <p className="text-[11px] text-[#8c7b6c] mt-0.5">{sublabel}</p>
        </div>
        <span className="text-[10px] text-[#b09e8d] bg-[#22160d] px-2 py-0.5 rounded-full border border-[#3e2819]">
          {aspectRatioLabel}
        </span>
      </div>

      {error && (
        <div className="p-2 rounded-xl bg-[#381616] border border-[#5e2525] text-xs text-[#ffb4b4] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropzone Area */}
      <div
        id={`dropzone-${id}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all p-3 flex flex-col sm:flex-row items-center gap-3.5 ${
          isDragging
            ? 'border-[#e08244] bg-[#2d1b10]'
            : currentImageUrl
            ? 'border-[#4a3220] bg-[#1a120c] hover:border-[#63432b]'
            : 'border-[#382619] bg-[#17100b] hover:border-[#523723] hover:bg-[#1e150e]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          id={`file-input-${id}`}
        />

        {/* Thumbnail Preview or Icon */}
        <div className="w-20 h-24 sm:w-20 sm:h-24 rounded-lg bg-[#25170e] border border-[#3e2718] overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : defaultImageFallbackUrl ? (
            <div className="relative w-full h-full">
              <img
                src={defaultImageFallbackUrl}
                alt="Padrão"
                className="w-full h-full object-cover opacity-40 grayscale"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Upload className="w-5 h-5 text-[#debfa6]" />
              </div>
            </div>
          ) : (
            <Upload className="w-6 h-6 text-[#8c7b6c] group-hover:text-[#e08244] transition-colors" />
          )}
        </div>

        {/* Info & action buttons */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          {currentImageUrl ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#79a665]">
                <Check className="w-3.5 h-3.5" />
                <span>Imagem personalizada carregada</span>
              </div>
              <p className="text-[11px] text-[#b09e8d]">
                Clique ou arraste outro arquivo para substituir a imagem.
              </p>
              <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#f08585] bg-[#321616] hover:bg-[#481c1c] border border-[#522121] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover e usar padrão</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#faf3e8]">
                Arraste a foto aqui ou <span className="text-[#e08244] underline">clique para selecionar</span>
              </div>
              <p className="text-[11px] text-[#8c7b6c]">
                Formatos aceitos: JPG, PNG ou WEBP até 10MB.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Description Input for Prompt Generation Context */}
      {onDescriptionChange && (
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-medium text-[#b09e8d] flex items-center justify-between">
            <span>Detalhes para a IA incluir no prompt (opcional):</span>
            <span className="text-[10px] text-[#736354]">Ajuda a fidelizar a cena</span>
          </label>
          <input
            type="text"
            value={descriptionValue || ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={descriptionPlaceholder || "Ex: Senhor com chapéu de couro e barba branca..."}
            className="w-full px-3 py-2 rounded-xl bg-[#1d130c] border border-[#382619] text-xs text-[#faf3e8] placeholder-[#786757] focus:outline-none focus:border-[#c26a2c] focus:ring-1 focus:ring-[#c26a2c] transition-all"
          />
        </div>
      )}
    </div>
  );
};
