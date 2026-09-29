export const describeHttpError = async (
  response: Response,
  fallback = 'Nao foi possivel concluir agora. Tente novamente.'
): Promise<string> => {
  if (response.status === 413) {
    return 'Arquivo grande demais para envio. Remova o video/imagem de referencia ou use um arquivo menor.';
  }

  let detail = '';

  try {
    const payload = await response.json();
    detail = String(payload?.error || payload?.message || '');
  } catch {
    detail = '';
  }

  if (detail) {
    if (response.status >= 500) {
      return `${detail} (HTTP ${response.status})`;
    }
    return detail;
  }

  if (response.status === 401) {
    return 'Sessao expirada. Faca login novamente.';
  }

  if (response.status === 403) {
    return 'Acesso nao liberado para o seu usuario.';
  }

  if (response.status >= 500) {
    return 'Falha no servidor de IA. Tente novamente em alguns instantes.';
  }

  return `${fallback} (HTTP ${response.status})`;
};
