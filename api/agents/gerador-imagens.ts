import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 1800) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

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

const buildPrompt = (body: any) => {
  const prompt = cleanText(body?.prompt, 1500);
  const style = cleanText(body?.style, 80) || 'realista cinematografico';
  const ratio = cleanText(body?.ratio, 30) || '1:1';
  const details = cleanText(body?.details, 500);

  return `
Gere uma imagem visualmente forte e pronta para uso em conteudo digital.

Ideia principal: ${prompt}
Estilo desejado: ${style}
Formato desejado: ${ratio}
Detalhes extras: ${details || 'Nao informado'}

Regras:
- Sem texto escrito na imagem, sem legendas, sem marca d'agua.
- Composicao limpa, alta qualidade, iluminacao profissional.
- Evite deformacoes em maos, rosto, objetos e perspectiva.
- Se houver pessoa, mantenha pele, olhos, cabelo e proporcoes naturais.
- Se for produto, mantenha o produto claro, central e facil de entender.
- Resultado deve parecer pronto para thumbnail, anuncio, post ou cena de video.
`.trim();
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const user = await checkAccess(req, res);
  if (!user) return;

  const prompt = cleanText(req.body?.prompt, 1500);
  if (!prompt) {
    return res.status(400).json({ error: 'Digite um prompt para gerar a imagem.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: buildPrompt(req.body) }],
      },
      config: {
        imageConfig: {
          aspectRatio: cleanText(req.body?.ratio, 30) || '1:1',
          imageSize: '1K',
        },
      },
    });

    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return res.status(500).json({ error: 'A IA nao retornou imagem. Tente ajustar o prompt.' });
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    return res.status(200).json({
      image: `data:${mimeType};base64,${imagePart.inlineData.data}`,
      mimeType,
    });
  } catch (error: any) {
    console.error('Gerador imagens agent error:', error);
    const message =
      error.status === 429 || error.message?.includes('429')
        ? 'Limite de uso da IA atingido agora. Tente novamente mais tarde.'
        : error.message || 'Nao foi possivel gerar a imagem.';

    return res.status(error.status || 500).json({ error: message });
  }
}
