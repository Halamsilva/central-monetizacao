import { handleKiwifyWebhook } from '../_kiwifyAccess';

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
  return res.status(result.status).json(result.body);
}
