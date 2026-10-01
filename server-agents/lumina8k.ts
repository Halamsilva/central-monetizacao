import { GoogleGenAI } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const { data: { user }, error: authError } = await serviceSupabase.auth.getUser(token);

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

const UPSCALE_PROMPT = `Sempre responda somente em JSON válido. Quando o usuário enviar uma imagem, a tarefa é obrigatoriamente copiar a mesma imagem com preservação máxima, aplicando apenas melhoria técnica de qualidade, nitidez, textura realista e upscale. É proibido reinterpretar, recriar, redesenhar, estilizar ou alterar qualquer elemento da imagem. A imagem final deve ser a mesma imagem, apenas mais nítida, mais limpa, mais detalhada e mais realista. Nunca mudar rosto, corpo, pose, enquadramento, expressão, roupa, cenário, iluminação, câmera, ângulo, proporções ou composição. Nunca adicionar, remover ou substituir elementos. Nunca embelezar, nunca corrigir traços, nunca alterar anatomia, nunca mudar a identidade visual.

Output Schema:
{
  "mode": "image_to_image",
  "copy_prompt": "string",
  "negative_prompt": "string"
}

Generation Logic for image_input:
copy_prompt: "Use the uploaded image as the exact base reference and preserve it with maximum fidelity. Reproduce the exact same image without changing anything: same person, same face, same body, same proportions, same pose, same expression, same hairstyle, same clothing, same accessories, same background, same objects, same framing, same selfie angle, same perspective, same lighting direction, same shadows, same colors, same environment, same composition. Do not redesign, do not reinterpret, do not beautify, do not stylize, do not alter anatomy, do not modify facial features, do not change body shape, do not change hair, do not replace background, do not add or remove elements. Only perform a true photorealistic upscale and detail recovery with HYPER-REALISTIC SKIN TEXTURE: improve sharpness, restore fine skin texture, visible pores, subtle skin imperfections, natural skin highlights, subsurface scattering, fine facial hair (vellus hair), realistic skin tones, realistic eyes, natural reflections, individual hair strands, realistic fabric texture, clean detail reconstruction, realistic daylight rendering, natural contrast, high dynamic range, premium camera clarity, believable real photography. The final result must look like the exact same original image, only enhanced in quality and realism. NO AIRBRUSHING, NO SKIN SMOOTHING."
negative_prompt: "change face, different person, different body, different pose, different framing, different angle, different clothes, different background, different lighting, altered anatomy, beautified face, stylized image, artistic reinterpretation, cgi, 3d render, cartoon, anime, doll face, plastic skin, waxy skin, beauty filter, fake pores, oversmoothed skin, artificial symmetry, extra fingers, warped limbs, modified composition, replaced details, new elements, removed elements, fake hair, overprocessed image, unrealistic lighting, airbrushed skin, skin smoothing, plastic texture, blurred skin"`;

const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

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

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  const imageBase64 = String(req.body?.imageBase64 || '');
  if (!imageBase64) {
    return res.status(400).json({ error: 'Envie uma imagem para o upscale.' });
  }

  const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: UPSCALE_PROMPT },
          ],
        },
        config: { responseMimeType: 'application/json' },
      });

      const text = response.text || '';
      if (text.trim()) {
        let parsed: any = {};
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { mode: 'image_to_image', copy_prompt: text, negative_prompt: '' };
        }
        return res.json({ success: true, ...parsed });
      }
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || '');
      const retryable =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota') ||
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('high demand') ||
        message.includes('overloaded') ||
        message.includes('not found') ||
        message.includes('NOT_FOUND');
      if (!retryable) break;
    }
  }

  console.error('Lumina 8K error:', lastError);
  const message = String(lastError?.message || '');
  let friendly = 'Nao consegui gerar o prompt de upscale agora. Tente novamente.';
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    friendly = 'Limite de uso da IA atingido (cota diaria). Aguarde alguns minutos ou configure outra chave em Configuracoes.';
  } else if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) {
    friendly = 'Sua chave do Google AI Studio foi recusada. Confira a chave em Configuracoes.';
  }

  return res.status(500).json({ error: friendly });
}
