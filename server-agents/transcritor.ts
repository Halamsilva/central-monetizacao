import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { recordAiMetric } from './aiGateway.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const clean = (value: unknown, max = 200) => String(value || '').trim().slice(0, max);

const LANGUAGES: Record<string, string> = {
  pt: 'pt',
  en: 'en',
  es: 'es',
};

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

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

const friendlyGroqError = (status: number, detail: string) => {
  if (status === 401 || status === 403) {
    return 'A chave de transcricao da plataforma foi recusada. Avise o suporte.';
  }

  if (status === 429) {
    return 'O limite de transcricao por minuto da Groq foi atingido. Aguarde um pouco e tente de novo.';
  }

  if (status === 413) {
    return 'O trecho de audio ficou grande demais. Tente um video mais curto.';
  }

  if (status >= 500) {
    return 'Os servidores da Groq estao instaveis agora. Tente novamente em instantes.';
  }

  return detail ? `Falha ao transcrever (${status}).` : 'Nao consegui transcrever este trecho.';
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

  const apiKey = String(process.env.GROQ_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da Groq nao configurada na plataforma.' });
  }

  const rawBase64 = String(req.body?.audioBase64 || '');
  const audioBase64 = rawBase64.replace(/^data:audio\/[a-z0-9.+-]+;base64,/i, '');
  const language = LANGUAGES[clean(req.body?.language, 5)] || '';
  const offsetSeconds = Math.max(0, Number(req.body?.offsetSeconds) || 0);

  if (!audioBase64) {
    return res.status(400).json({ error: 'Nenhum audio foi recebido.' });
  }

  if (audioBase64.length > Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 64) {
    return res.status(413).json({ error: 'Trecho de audio grande demais (maximo 3MB).' });
  }

  const buffer = Buffer.from(audioBase64, 'base64');

  if (!buffer.length) {
    return res.status(400).json({ error: 'Nao consegui ler o audio enviado.' });
  }

  if (buffer.length > MAX_AUDIO_BYTES) {
    return res.status(413).json({ error: 'Trecho de audio grande demais (maximo 3MB).' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  const startedAt = Date.now();

  try {
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: 'audio/mpeg' }), 'audio.mp3');
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');

    if (language) form.append('language', language);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = String(payload?.error?.message || payload?.message || '').trim();
      recordAiMetric({
        agent: 'transcritor',
        provider: 'groq',
        model: 'whisper-large-v3-turbo',
        outcome: 'error',
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      console.warn('[transcritor] falhou:', response.status, detail.slice(0, 160));
      return res.status(response.status).json({ error: friendlyGroqError(response.status, detail) });
    }

    const segments = Array.isArray(payload?.segments)
      ? payload.segments
          .map((segment: any) => ({
            start: Math.max(0, Number(segment?.start) || 0) + offsetSeconds,
            end: Math.max(0, Number(segment?.end) || 0) + offsetSeconds,
            text: clean(segment?.text, 2000),
            noSpeech: Number(segment?.no_speech_prob) || 0,
          }))
          .filter((segment: any) => segment.text && segment.noSpeech < 0.85)
      : [];

    recordAiMetric({
      agent: 'transcritor',
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      outcome: 'success',
      durationMs: Date.now() - startedAt,
    });

    return res.json({
      ok: true,
      text: String(payload?.text || '').trim(),
      language: String(payload?.language || ''),
      duration: Number(payload?.duration) || 0,
      segments,
    });
  } catch (err: any) {
    const message = String(err?.message || err);
    recordAiMetric({
      agent: 'transcritor',
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      outcome: 'error',
      code: String(err?.name || err?.code || 'ERROR'),
      durationMs: Date.now() - startedAt,
    });

    if (err?.name === 'AbortError' || /aborted|timeout/i.test(message)) {
      return res.status(504).json({ error: 'A transcricao demorou demais. Tente novamente.' });
    }

    console.error('[transcritor] erro:', message);
    return res.status(500).json({ error: 'Falha ao falar com a Groq.' });
  } finally {
    clearTimeout(timer);
  }
}
