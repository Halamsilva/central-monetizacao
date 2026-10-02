export const describeHttpError = async (
  response: Response,
  fallback = 'Nao foi possivel concluir agora. Tente novamente.'
): Promise<string> => {
  if (response.status === 413) {
    return 'Arquivo grande demais para envio. Remova o video/imagem de referencia ou use um arquivo menor.';
  }

  // Timeouts de borda (Cloudflare 524, gateways 502/504): nao e bug do agente,
  // o pedido de IA demorou mais do que o limite da rede.
  if (response.status === 524) {
    return 'A geracao demorou mais do que o limite da rede (timeout). Tente novamente em instantes ou use um clipe/roteiro mais curto.';
  }

  if (response.status === 502 || response.status === 504) {
    return 'O servidor demorou demais para responder (timeout). Tente novamente em instantes.';
  }

  let detail = '';

  try {
    const payload = await response.json();
    detail = String(payload?.error || payload?.message || '');

    const extra = String(payload?.detail || '').trim();
    if (extra) {
      detail = detail ? `${detail} Detalhe: ${extra}` : `Detalhe: ${extra}`;
    }
  } catch {
    detail = '';
  }

  // Se a resposta nao for JSON (ex.: pagina HTML de desafio/verificacao de seguranca),
  // avisa de forma clara em vez de despejar codigo HTML no erro.
  if (!detail) {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('text/html')) {
      return 'O acesso foi interrompido por uma verificacao de seguranca da rede. Tente novamente ou recarregue a pagina.';
    }
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
