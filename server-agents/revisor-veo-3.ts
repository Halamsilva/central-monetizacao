import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 6000) =>
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

const systemInstruction = `
Você é um diretor cinematográfico e revisor técnico de prompts para Veo 3.

Sua função é corrigir, estruturar, limpar e otimizar o prompt do usuário sem mudar a ideia central, produto, ação principal ou contexto da cena.

Regras obrigatórias:
- Mantenha o objetivo principal do prompt original.
- Remova ambiguidades, comandos conflitantes e descrições impossíveis.
- Reescreva as descrições completas, sem usar "mesma descrição anterior".
- Descreva cenário, personagem, ação, câmera, iluminação, estilo visual, roupas, movimento, ambiente e áudio.
- Mantenha continuidade física dos personagens, roupas, idade, aparência e iluminação durante toda a cena.
- Transforme linguagem arriscada em linguagem cinematográfica, publicitária, editorial ou comercial.
- Se houver pessoa famosa, não cite nomes no prompt final. Substitua por uma descrição física genérica e profissional.
- Mulheres devem sempre ser descritas como adultas e em contexto comercial, editorial, lifestyle ou publicitário.
- Evite termos sexualizados, explícitos, fetichistas ou focados em partes íntimas.
- O prompt final deve estar em inglês, pronto para colar no Veo 3.
- Responda somente em JSON válido no schema solicitado.

Bloco obrigatório de realismo para integrar ao prompt final:
realistic natural human skin texture, visible pores, natural facial asymmetry, subtle skin imperfections, realistic hands, detailed fingers, natural body proportions, cinematic lighting, realistic fabric physics, realistic movement, ultra realistic environment, authentic depth, physically coherent shadows, premium cinematic commercial quality, highly detailed textures, realistic camera behavior, natural reflections, realistic facial details, no plastic skin, no beauty filter, no over smoothing, authentic human appearance.
`.trim();

const buildPrompt = (prompt: string) => `
Prompt original do usuário:
${prompt}

Revise e otimize esse prompt para Veo 3.
Preserve a ideia principal, mas deixe a cena mais clara, segura, cinematográfica e tecnicamente consistente.
`.trim();

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

  const prompt = cleanText(req.body?.prompt);
  if (!prompt) {
    return res.status(400).json({ error: 'Informe um prompt para revisar.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: buildPrompt(prompt),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scene: { type: Type.STRING },
            character: { type: Type.STRING },
            environment: { type: Type.STRING },
            action: { type: Type.STRING },
            camera: { type: Type.STRING },
            lighting: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            realisticDetails: { type: Type.STRING },
            audio: { type: Type.STRING },
            finalPrompt: { type: Type.STRING },
          },
          required: [
            'title',
            'scene',
            'character',
            'environment',
            'action',
            'camera',
            'lighting',
            'visualStyle',
            'realisticDetails',
            'audio',
            'finalPrompt',
          ],
        },
      },
    });

    if (!result.text) {
      return res.status(500).json({ error: 'Empty Gemini response' });
    }

    return res.status(200).json(JSON.parse(result.text));
  } catch (error: any) {
    console.error('Revisor Veo 3 agent error:', error);
    const message = error.status === 429 || error.message?.includes('429')
      ? 'Limite de uso da IA atingido agora. Tente novamente mais tarde.'
      : error.message || 'Não foi possível revisar o prompt.';

    return res.status(error.status || 500).json({ error: message });
  }
}
