import crypto from 'node:crypto';
import { handleKiwifyWebhook } from '../_kiwifyAccess.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configuredToken = String(process.env.KIWIFY_WEBHOOK_TOKEN || '');
  const signature = String(req.query?.signature || '');
  const rawBody = JSON.stringify(req.body || {});

  const hmac = (algorithm: string, data: string, key: string) =>
    crypto.createHmac(algorithm, key).update(data, 'utf8').digest();

  // O Kiwify manda o token configurado como ?signature=. Ele pode vir puro
  // (token) ou como assinatura HMAC do corpo. Testamos as variacoes conhecidas.
  const candidates: Record<string, string> = {};

  if (configuredToken && signature) {
    for (const algorithm of ['sha1', 'sha256']) {
      const digest = hmac(algorithm, rawBody, configuredToken);
      candidates[`${algorithm}_hex`] = digest.toString('hex');
      candidates[`${algorithm}_base64`] = digest.toString('base64');
      candidates[`${algorithm}_base64url`] = digest.toString('base64url');
    }
  }

  const matchingCandidate = Object.entries(candidates).find(([, value]) => value === signature)?.[0] || '';
  const signatureIsPlainToken = Boolean(configuredToken) && signature === configuredToken;

  const token = matchingCandidate || signatureIsPlainToken
    ? configuredToken
    : (signature || req.query?.token || req.body?.token);

  const result = await handleKiwifyWebhook(req.body, token);

  if (result.status === 401) {
    console.warn(
      '[kiwify] DIAGNOSTICO assinatura | ' +
        `signature_len=${signature.length} | ` +
        `body_len=${rawBody.length} | ` +
        `candidato_que_bateu=${matchingCandidate || 'nenhum'} | ` +
        `sha1_hex_prefix=${(candidates.sha1_hex || '').slice(0, 10)} | ` +
        `sha256_hex_prefix=${(candidates.sha256_hex || '').slice(0, 10)} | ` +
        `signature_prefix=${signature.slice(0, 10)}`,
    );
  }

  return res.status(result.status).json(result.body);
}