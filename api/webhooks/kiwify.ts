import { handleKiwifyWebhook } from '../_kiwifyAccess.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token =
    req.headers['x-kiwify-token'] ||
    req.headers['x-webhook-token'] ||
    req.query?.token ||
    req.body?.token ||
    req.body?.webhook_token ||
    req.body?.webhook?.token;

  const result = await handleKiwifyWebhook(req.body, token);

  // Diagnostico: quando o token nao bate, mostra ONDE ele veio e as chaves do
  // payload (sem expor o valor), para descobrirmos o formato do Kiwify.
  if (result.status === 401) {
    const mask = (value: unknown) => {
      const text = String(value || '');
      if (!text) return 'vazio';
      return text.length <= 6 ? '***' : `${text.slice(0, 3)}***${text.slice(-2)}`;
    };

    const body = req.body || {};

    console.warn(
      '[kiwify] DIAGNOSTICO token invalido | ' +
        `token_lido=${mask(token)} | ` +
        `header_x_kiwify=${mask(req.headers['x-kiwify-token'])} | ` +
        `header_x_webhook=${mask(req.headers['x-webhook-token'])} | ` +
        `query_token=${mask(req.query?.token)} | ` +
        `body_token=${mask(body.token)} | ` +
        `body_webhook_token=${mask(body.webhook_token)} | ` +
        `query_keys=${Object.keys(req.query || {}).join(',') || 'nenhuma'} | ` +
        `body_keys=${Object.keys(body).join(',')}`,
    );
  }

  return res.status(result.status).json(result.body);
}