import { createClient } from '@supabase/supabase-js';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 12000) =>
  String(value || '')
    .trim()
    .replace(/\r\n/g, '\n')
    .slice(0, maxLength);

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const checkAccess = async (req: any, res: any) => {
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
    return null;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Failed to check access' });
    return null;
  }

  const canUseAgent =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUseAgent) {
    res.status(403).json({ error: 'Access not released' });
    return null;
  }

  return user;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await checkAccess(req, res);
  if (!user) return;

  const ttsUrl = process.env.SELF_HOSTED_TTS_URL;
  if (!ttsUrl) {
    return res.status(503).json({
      error:
        'Servidor de narração ainda não configurado. Configure SELF_HOSTED_TTS_URL quando o Piper/Kokoro estiver hospedado.',
    });
  }

  const text = cleanText(req.body?.text);
  if (!text) {
    return res.status(400).json({ error: 'Cole um roteiro para gerar a narração.' });
  }

  const voice = cleanText(req.body?.voice, 120) || process.env.SELF_HOSTED_TTS_DEFAULT_VOICE || 'pt_BR';
  const speed = clampNumber(req.body?.speed, 0.6, 1.4, 1);
  const pitch = clampNumber(req.body?.pitch, 0.7, 1.3, 1);

  try {
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SELF_HOSTED_TTS_TOKEN
          ? { Authorization: `Bearer ${process.env.SELF_HOSTED_TTS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
        pitch,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: errorText || 'O servidor de narração não conseguiu gerar o áudio.',
      });
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline; filename="narracao.mp3"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (error: any) {
    console.error('Narracao agent error:', error);
    return res.status(500).json({ error: error.message || 'Falha ao conectar no servidor de narração.' });
  }
}
