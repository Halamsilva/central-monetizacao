import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const MAGIC_HOUR_BASE = 'https://api.magichour.ai';

const FREE_MODELS = ['ltx-2.5', 'minimax-h3'];

const VIDEO_CREDIT_RATES: Record<string, Record<string, number>> = {
  'ltx-2.5': { '480p': 24, '720p': 48, '1080p': 72 },
  'minimax-h3': { '480p': 24, '720p': 48, '1080p': 72 },
};

const clean = (value: unknown, maxLength = 20000) =>
  String(value || '').trim().slice(0, maxLength);

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
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

const getUserVideoKey = async (serviceSupabase: any, userId: string) => {
  const { data, error } = await serviceSupabase
    .from('user_secrets')
    .select('video_api_key')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { apiKey: '', provider: 'magichour' };

  return {
    apiKey: String(data?.video_api_key || '').trim(),
    provider: 'magichour',
  };
};

const friendlyProviderError = (status: number, code: string, message: string) => {
  if (status === 401) {
    return 'Sua chave da Magic Hour foi recusada. Confira a chave em "Minha chave de video" aqui no Estudio.';
  }

  if (code === 'insufficient_credits') {
    return 'Seus creditos de video acabaram. Adicione creditos (packs a partir de US$ 10) na sua conta da Magic Hour em magichour.ai para continuar gerando.';
  }

  if (code === 'subscription_required' || code === 'plan_upgrade_required') {
    return 'Este recurso (modelo ou resolucao) exige um plano pago na sua conta da Magic Hour. Use o modelo LTX 2.5 em 480p, disponivel para contas gratuitas.';
  }

  if (status === 402) {
    return 'Sua conta da Magic Hour precisa de creditos ou plano pago para esta geracao. Adicione creditos em magichour.ai.';
  }

  if (status === 429) {
    return 'Muitas geracoes em pouco tempo na Magic Hour. Aguarde alguns instantes e tente novamente.';
  }

  if (status >= 500) {
    return 'A Magic Hour esta instavel agora. Tente novamente em alguns instantes.';
  }

  return message || 'Nao consegui concluir a geracao do video. Tente novamente.';
};

const callMagicHour = async (path: string, apiKey: string, init?: { method?: string; body?: unknown }) => {
  const response = await fetch(`${MAGIC_HOUR_BASE}${path}`, {
    method: init?.method || 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { ok: response.ok, status: response.status, payload };
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

  const action = clean(req.body?.action, 40);

  // ---------------------------------------------------------------- account
  if (action === 'account') {
    const { apiKey } = await getUserVideoKey(serviceSupabase, user.id);
    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua chave de video da Magic Hour para continuar.' });
    }

    const { ok, status, payload } = await callMagicHour('/v1/account', apiKey);
    if (!ok) {
      return res.status(status).json({
        error: friendlyProviderError(status, payload?.code, payload?.message),
      });
    }

    return res.status(200).json({ credits: payload?.credits ?? null });
  }

  // ----------------------------------------------------------------- submit
  // --------------------------------------------------------- upload do frame
  // Sobe a imagem inicial para o storage da Magic Hour e devolve o file_path,
  // que e o que o endpoint de image-to-video usa como primeiro quadro.
  if (action === 'upload-frame') {
    const { apiKey } = await getUserVideoKey(serviceSupabase, user.id);
    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua chave de video da Magic Hour para continuar.' });
    }

    const rawBase64 = String(req.body?.imageBase64 || '');
    const imageBase64 = rawBase64.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const imageUrl = clean(req.body?.imageUrl, 1200);
    const informedMime = clean(req.body?.mimeType, 40) || 'image/jpeg';

    let buffer: Buffer;
    let mimeType = informedMime;

    if (imageUrl) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);

      try {
        const imageResponse = await fetch(imageUrl, { signal: controller.signal });

        if (!imageResponse.ok) {
          return res.status(400).json({ error: 'Nao consegui baixar a imagem gerada. Tente novamente.' });
        }

        const bytes = await imageResponse.arrayBuffer();
        buffer = Buffer.from(bytes);
        mimeType = String(imageResponse.headers.get('content-type') || informedMime).split(';')[0].trim();
      } catch {
        return res.status(400).json({ error: 'Nao consegui baixar a imagem gerada. Tente novamente.' });
      } finally {
        clearTimeout(timer);
      }
    } else {
      if (!imageBase64) {
        return res.status(400).json({ error: 'Nenhuma imagem foi recebida.' });
      }

      buffer = Buffer.from(imageBase64, 'base64');
    }

    const extension = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
        ? 'webp'
        : mimeType.includes('gif')
          ? 'gif'
          : 'jpg';

    if (!buffer.length) {
      return res.status(400).json({ error: 'Nao consegui ler essa imagem. Tente outro arquivo.' });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Imagem muito grande. Use uma foto menor que 10MB.' });
    }

    const presign = await callMagicHour('/v1/files/upload-urls', apiKey, {
      method: 'POST',
      body: { items: [{ type: 'image', extension }] },
    });

    if (!presign.ok) {
      return res.status(presign.status).json({
        error: friendlyProviderError(presign.status, presign.payload?.code, presign.payload?.message),
      });
    }

    const uploadItem = presign.payload?.items?.[0];

    if (!uploadItem?.upload_url || !uploadItem?.file_path) {
      return res.status(500).json({ error: 'O provedor nao devolveu a URL de upload.' });
    }

    const uploadResponse = await fetch(uploadItem.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      console.error('Magic Hour image upload failed:', uploadResponse.status);
      return res.status(500).json({ error: 'Nao consegui enviar a imagem para o provedor.' });
    }

    return res.status(200).json({ ok: true, filePath: uploadItem.file_path });
  }

  if (action === 'submit') {
    const { apiKey } = await getUserVideoKey(serviceSupabase, user.id);
    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua chave de video da Magic Hour para continuar.' });
    }

    const prompt = clean(req.body?.prompt);
    const imageFilePath = clean(req.body?.imageFilePath, 300);
    const model = clean(req.body?.model, 40) || 'ltx-2.5';
    const resolution = clean(req.body?.resolution, 10) || '480p';
    const aspectRatio = clean(req.body?.aspectRatio, 10) || '9:16';
    const audio = req.body?.audio === true;
    const durationSeconds = Math.round(Number(req.body?.durationSeconds) || 5);

    if (!imageFilePath && prompt.length < 5) {
      return res.status(400).json({ error: 'Escreva um prompt com pelo menos 5 caracteres.' });
    }

    if (!FREE_MODELS.includes(model)) {
      return res.status(400).json({ error: 'Modelo indisponivel. Use LTX 2.5 ou MiniMax H3 (disponiveis para contas gratuitas).' });
    }

    if (!['480p', '720p', '1080p'].includes(resolution)) {
      return res.status(400).json({ error: 'Resolucao invalida.' });
    }

    if (!['9:16', '16:9', '1:1'].includes(aspectRatio)) {
      return res.status(400).json({ error: 'Proporcao invalida.' });
    }

    const maxDuration = model === 'minimax-h3' ? 30 : 60;
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > maxDuration) {
      return res.status(400).json({ error: `Duracao invalida para este modelo (use de 1 a ${maxDuration} segundos).` });
    }

    const rate = VIDEO_CREDIT_RATES[model]?.[resolution] || 24;
    const estimatedCredits = rate * durationSeconds;

    const { data: inserted, error: insertError } = await serviceSupabase
      .from('video_generations')
      .insert({
        user_id: user.id,
        provider: 'magichour',
        model,
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: durationSeconds,
        status: 'queued',
      })
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      console.error('video_generations insert error:', insertError);
      return res.status(500).json({ error: 'Nao consegui registrar a geracao. Avise o suporte.' });
    }

    const generationId = String(inserted.id);

    const isImageMode = Boolean(imageFilePath);
    const endpoint = isImageMode ? '/v1/image-to-video' : '/v1/text-to-video';
    const baseBody: Record<string, unknown> = {
      name: `Estudio de Videos IA - ${generatedNameTag()}`,
      end_seconds: durationSeconds,
      resolution,
      model,
      audio,
      style: { prompt: prompt || 'Movimento cinematografico suave, camera lenta, iluminacao natural.' },
    };

    const requestBody = isImageMode
      ? { ...baseBody, assets: { image_file_path: imageFilePath } }
      : { ...baseBody, aspect_ratio: aspectRatio };

    const { ok, status, payload } = await callMagicHour(endpoint, apiKey, {
      method: 'POST',
      body: requestBody,
    });

    if (!ok) {
      await serviceSupabase
        .from('video_generations')
        .update({
          status: 'error',
          error_message: String(payload?.message || 'Falha ao criar o job.').slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);

      return res.status(status).json({
        error: friendlyProviderError(status, payload?.code, payload?.message),
        generation_id: generationId,
      });
    }

    await serviceSupabase
      .from('video_generations')
      .update({
        provider_job_id: String(payload?.id || ''),
        credits_charged: Number(payload?.credits_charged) || null,
        status: 'rendering',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    return res.status(200).json({
      generation_id: generationId,
      provider_job_id: payload?.id || null,
      credits_charged: Number(payload?.credits_charged) || null,
      estimated_credits: estimatedCredits,
    });
  }

  // ----------------------------------------------------------------- status
  if (action === 'status') {
    const generationId = clean(req.body?.generationId, 60);
    if (!generationId) {
      return res.status(400).json({ error: 'Geracao nao informada.' });
    }

    const { data: row, error: rowError } = await serviceSupabase
      .from('video_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (rowError || !row) {
      return res.status(404).json({ error: 'Geracao nao encontrada.' });
    }

    if (row.status === 'complete' || row.status === 'error' || row.status === 'canceled') {
      return res.status(200).json({
        status: row.status,
        video_url: row.video_url || null,
        credits_charged: row.credits_charged || null,
        error_message: row.error_message || null,
      });
    }

    const { apiKey } = await getUserVideoKey(serviceSupabase, user.id);
    if (!apiKey) {
      return res.status(400).json({ error: 'Configure sua chave de video da Magic Hour para continuar.' });
    }

    const { ok, status, payload } = await callMagicHour(
      `/v1/video-projects/${encodeURIComponent(String(row.provider_job_id || ''))}`,
      apiKey
    );

    if (!ok) {
      return res.status(status).json({
        error: friendlyProviderError(status, payload?.code, payload?.message),
      });
    }

    const providerStatus = String(payload?.status || 'rendering');
    const videoUrl = Array.isArray(payload?.downloads) && payload.downloads[0]?.url
      ? String(payload.downloads[0].url)
      : null;

    const mappedStatus =
      providerStatus === 'complete'
        ? 'complete'
        : providerStatus === 'error'
          ? 'error'
          : providerStatus === 'canceled'
            ? 'canceled'
            : providerStatus === 'queued'
              ? 'queued'
              : 'rendering';

    await serviceSupabase
      .from('video_generations')
      .update({
        status: mappedStatus,
        video_url: videoUrl,
        credits_charged: Number(payload?.credits_charged) || row.credits_charged || null,
        error_message: mappedStatus === 'error'
          ? String(payload?.error?.message || payload?.message || 'Falha na geracao.').slice(0, 500)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    return res.status(200).json({
      status: mappedStatus,
      video_url: videoUrl,
      credits_charged: Number(payload?.credits_charged) || row.credits_charged || null,
      error_message: mappedStatus === 'error' ? String(payload?.message || '').slice(0, 300) : null,
    });
  }

  // ---------------------------------------------------------------- history
  if (action === 'history') {
    const { data, error } = await serviceSupabase
      .from('video_generations')
      .select('id, model, prompt, aspect_ratio, resolution, duration_seconds, status, video_url, credits_charged, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: 'Nao consegui carregar o historico.' });
    }

    return res.status(200).json({ items: data || [] });
  }

  return res.status(400).json({ error: 'Acao invalida.' });
}

function generatedNameTag() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
