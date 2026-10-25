import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const MODELS = ['agnes-image-2.5-flash', 'agnes-image-2.1-flash', 'agnes-image-2.0-flash'];

const SIZES = ['1024x1024', '1024x1536', '1536x1024', '720x1280', '1280x720'];

const clean = (value: unknown, max = 2000) => String(value || '').trim().slice(0, max);

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Erro ao conferir acesso.' });
    return null;
  }

  const canUse =
    profile?.role === 'admin' || (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

const friendlyError = (status: number, detail: string) => {
  if (status === 401 || status === 403) {
    return 'A chave da Agnes AI foi recusada. Avise o suporte para renovar a chave da plataforma.';
  }

  if (status === 429) {
    return 'O limite diario de imagens da Agnes foi atingido. Tente novamente mais tarde.';
  }

  if (status === 402 || /quota|credit|balance/i.test(detail)) {
    return 'A conta da Agnes AI esta sem creditos no momento.';
  }

  if (status >= 500) {
    return 'Os servidores da Agnes estao instaveis agora. Tente novamente em instantes.';
  }

  return detail ? `Nao consegui gerar a imagem (${status}).` : 'Nao consegui gerar a imagem.';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();

  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const apiKey = String(process.env.AGNES_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da Agnes AI nao configurada na plataforma.' });
  }

  const action = clean(req.body?.action, 30) || 'generate';

  if (action !== 'generate') {
    return res.status(400).json({ error: 'Acao invalida.' });
  }

  const prompt = clean(req.body?.prompt, 2000);
  const model = clean(req.body?.model, 60) || MODELS[0];
  const size = clean(req.body?.size, 20) || SIZES[0];

  if (prompt.length < 5) {
    return res.status(400).json({ error: 'Descreva a imagem com pelo menos 5 caracteres.' });
  }

  if (!MODELS.includes(model)) {
    return res.status(400).json({ error: 'Modelo indisponivel.' });
  }

  if (!SIZES.includes(size)) {
    return res.status(400).json({ error: 'Tamanho indisponivel.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 190000);

  try {
    const response = await fetch('https://apihub.agnes-ai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, prompt, size, n: 1 }),
      signal: controller.signal,
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = String(payload?.error?.message || payload?.message || '').trim();
      console.warn('[agnes-imagens] falhou:', response.status, detail.slice(0, 160));
      return res.status(response.status).json({ error: friendlyError(response.status, detail) });
    }

    const item = payload?.data?.[0];
    const imageUrl = String(item?.url || '').trim();

    if (!imageUrl) {
      return res.status(502).json({ error: 'A Agnes nao devolveu a imagem. Tente novamente.' });
    }

    return res.json({
      ok: true,
      url: imageUrl,
      model,
      size,
      taskId: String(payload?.task_id || ''),
    });
  } catch (err: any) {
    const message = String(err?.message || err);

    if (err?.name === 'AbortError' || /aborted|timeout/i.test(message)) {
      return res.status(504).json({ error: 'A imagem demorou demais para sair. Tente novamente.' });
    }

    console.error('[agnes-imagens] erro:', message);
    return res.status(500).json({ error: 'Falha ao falar com a Agnes AI.' });
  } finally {
    clearTimeout(timer);
  }
}
