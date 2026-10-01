const CHUNK_START_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

const extractApiError = async (response: Response) => {
  try {
    const payload = await response.json();
    return String(payload?.error?.message || '');
  } catch {
    return '';
  }
};

// Upload direto no Files API do Gemini usando a chave do proprio usuario.
// Evita o limite de 4,5 MB do corpo das funcoes serverless.
export const uploadVideoToGemini = async (
  file: File,
  key: string,
  onProgress?: (percent: number) => void
): Promise<{ fileUri: string; fileName: string }> => {
  const startUrl = `${CHUNK_START_URL}?key=${encodeURIComponent(key)}`;

  const startResponse = await fetch(startUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(file.size),
      'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: file.name || 'clonagem-video' } }),
  });

  if (!startResponse.ok) {
    const detail = await extractApiError(startResponse);
    if (startResponse.status === 403 || detail.toLowerCase().includes('blocked')) {
      throw new Error(
        'Sua chave do Google AI Studio bloqueia o upload de arquivos. Crie uma chave nova (sem restricoes) em aistudio.google.com/app/apikey.'
      );
    }
    throw new Error(detail || 'Falha ao iniciar o upload do video.');
  }

  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Nao consegui iniciar o upload do video.');

  const uploaded = await new Promise<{ fileUri: string; fileName: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
    xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('Falha ao enviar o video. Tente novamente.'));
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        const uri = payload?.file?.uri;
        const name = payload?.file?.name;
        if (uri) resolve({ fileUri: String(uri), fileName: String(name || '') });
        else reject(new Error('O upload nao retornou o arquivo.'));
      } catch {
        reject(new Error('Resposta de upload invalida.'));
      }
    };

    xhr.onerror = () => reject(new Error('Falha de rede no upload do video.'));
    xhr.send(file);
  });

  return uploaded;
};

// O Google processa o video antes de liberar a analise. Sem essa espera o
// generateContent recebe um arquivo em PROCESSING e a chamada falha.
export const waitForFileReady = async (
  fileName: string,
  key: string,
  onProgress?: (message: string) => void
) => {
  if (!fileName) return;

  const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${encodeURIComponent(key)}`;
  const deadline = Date.now() + 180000;

  while (Date.now() < deadline) {
    const statusResponse = await fetch(statusUrl);

    if (!statusResponse.ok) {
      throw new Error('Nao consegui verificar o processamento do video.');
    }

    const payload = await statusResponse.json().catch(() => ({}));
    const state = String(payload?.state || '');
    const apiError = String(payload?.error?.message || '');

    if (apiError) throw new Error(apiError);
    if (state === 'ACTIVE') return;

    if (state === 'FAILED') {
      throw new Error(
        'O Google nao conseguiu processar este video. Tente um clipe menor ou em mp4 (H.264).'
      );
    }

    onProgress?.('Processando o video no Google...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error('O video demorou demais para ser processado. Tente um clipe menor.');
};

export type AnalyzeVideoInput = {
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  language?: 'brasil' | 'estados_unidos' | 'mexico';
};

export const analyzeVideo = async (
  input: AnalyzeVideoInput,
  accessToken: string,
  retryCount = 0
): Promise<string> => {
  const response = await fetch('/api/agents/clonagem-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fileUri: input.fileUri,
      fileName: input.fileName,
      mimeType: input.mimeType || 'video/mp4',
      language: input.language || 'brasil',
    }),
  });

  const rawText = await response.text();
  let data: any = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  if ((response.status === 503 || response.status === 429) && retryCount < 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return analyzeVideo(input, accessToken, retryCount + 1);
  }

  if (!response.ok) {
    throw new Error(String(data?.error || data?.detail || `Erro no servidor (${response.status}).`));
  }

  if (!data?.result) {
    throw new Error('A IA nao retornou o resultado.');
  }

  return String(data.result);
};