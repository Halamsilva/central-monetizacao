import { GoogleGenAI, Type } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

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

  try {
    const { ingredientOrIdea = 'queijo e ervas frescas', cuisine = 'brasileira' } = req.body || {};

    const systemInstruction = `Você é o Mestre Centenário da Gastronomia, com 100 anos de sabedoria culinária acumulada entre o Brasil e o mundo.
Sua especialidade suprema é transformar ingredientes frescos do cotidiano em pratos espetaculares com rigor técnico, pesos medidos na balança e tempos de fogo precisos.
REGRA ESSENCIAL: NÃO FALE QUE VAI FICAR PRONTO EM 30 SEGUNDOS! Fale com autoridade sobre os ingredientes frescos, as quantidades e pesos exatos (gramas, ml, colheres), o tempo de preparo de cada ingrediente e o tempo real de cocção na frigideira ou marinada.
Você deve estruturar cada receita com uma sequência exata de 4 PROMPTS com FALAS DE 9 SEGUNDOS em cada prompt (total 36s de roteiro de vídeo curto para Reels, TikTok, Shorts).
Cada fala deve ser em português do Brasil vibrante, direto, apetitoso e calibrado para exatamente 9 segundos de ritmo falado (cerca de 20 a 26 palavras por fala).
- No Take 1: Apresente o prato e o gancho de apetite.
- No Take 2: Destaque os ingredientes frescos, pesos na balança e medidas exatas.
- No Take 3: Destaque o ponto exato do fogo, tempo de cocção dos ingredientes e técnica da frigideira.
- No Take 4: Destaque a finalização, textura da mordida e chamada de engajamento.

REGRA MANDATÓRIA DE CONTINUIDADE VISUAL:
Para garantir que os vídeos gerados com IA (Veo, Sora, Midjourney) ou gravados em câmera tenham continuidade absoluta, O CENÁRIO (tipo exato da bancada, parede de fundo, direção e temperatura da luz) e OS OBJETOS (panelas específicas com material e cabo, faca, tábua de corte, prato e tigelas) DEVEM SER IDÊNTICOS E IMUTÁVEIS em todos os 4 prompts, sem mudar de um take para o outro!`;

    const promptText = `Crie uma receita fantástica e prática para o cotidiano, com foco absoluto em ingredientes frescos, quantidades medidas e tempo de preparo detalhado.
Tema/Ingredientes pedidos pelo usuário: "${ingredientOrIdea}".
Culinária: ${cuisine === 'todas' ? 'Culinária Brasileira ou Internacional' : cuisine}.

A receita deve conter:
1. Título atraente e apetitoso.
2. País de origem / Inspiração e rendimento (ex: 2 porções).
3. Tempo de preparo dos ingredientes (minutos) e tempo de cocção (minutos).
4. Lista detalhada de ingredientes frescos com nome, quantidade exata (g, ml, colheres), tempo de preparo de cada um e dica técnica.
5. Lista de itens de despensa e temperos com quantidades.
6. Passos detalhados divididos por fases (Mise en Place, Fogo & Cocção, Finalização) com tempo estimado e temperatura do fogo.
7. O segredo de ouro do mestre dos 100 anos.
8. Descrição do Cenário Fixo Global (bancada, parede, iluminação constante).
9. Descrição dos Objetos & Utensílios Fixos Globais (panelas com cor e material exato, tábua, cerâmicas).
10. EXATAMENTE 4 PROMPTS de vídeo, cada um com:
   - takeNumber (1, 2, 3, 4)
   - timeRange ("0:00 - 0:09", "0:09 - 0:18", "0:18 - 0:27", "0:27 - 0:36")
   - actName (Ex: "Take 1: O Gancho & Apresentação", "Take 2: Ingredientes & Pesos na Bancada", "Take 3: O Ponto do Fogo & Tempo de Cocção", "Take 4: A Mordida & Gran Finale")
   - spokenLine: A fala exata de 9 segundos (20 a 26 palavras, cronometrada para leitura em 9s, FALANDO DE INGREDIENTES, QUANTIDADES E TEMPOS DE COCÇÃO, SEM DIZER 30 SEGUNDOS)
   - videoShotPrompt: Instrução visual detalhada de enquadramento (close-up macro, ângulo zenital 9:16 vertical, luz natural, vapor subindo)
   - soundFxCue: Som ambiente do momento (estalo de fogo, corte crocante, borbulhar de azeite)
   - fixedSceneContext: Descrição do cenário e iluminação específicos deste take MANTENDO O MESMO CENÁRIO IMUTÁVEL
   - fixedObjectsProps: Descrição dos objetos e utensílios específicos deste take MANTENDO OS MESMOS OBJETOS IMUTÁVEIS`;

    const buildConfig = () => ({
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          country: { type: Type.STRING },
          cuisineType: { type: Type.STRING, enum: ['brasileira', 'internacional'] },
          servings: { type: Type.STRING },
          prepTimeMinutes: { type: Type.INTEGER },
          cookTimeMinutes: { type: Type.INTEGER },
          totalTimeDisplay: { type: Type.STRING },
          freshIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                techniqueTip: { type: Type.STRING },
              },
              required: ['name', 'quantity', 'prepTime', 'techniqueTip'],
            },
          },
          pantryItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                quantity: { type: Type.STRING },
              },
              required: ['item', 'quantity'],
            },
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                phase: { type: Type.STRING },
                timeEstimate: { type: Type.STRING },
                action: { type: Type.STRING },
                description: { type: Type.STRING },
                temperatureOrFire: { type: Type.STRING },
              },
              required: ['stepNumber', 'phase', 'timeEstimate', 'action', 'description', 'temperatureOrFire'],
            },
          },
          masterSecret: { type: Type.STRING },
          fixedSceneGlobal: { type: Type.STRING },
          fixedObjectsGlobal: { type: Type.STRING },
          prompts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                takeNumber: { type: Type.INTEGER },
                timeRange: { type: Type.STRING },
                actName: { type: Type.STRING },
                spokenLine: { type: Type.STRING },
                videoShotPrompt: { type: Type.STRING },
                soundFxCue: { type: Type.STRING },
                fixedSceneContext: { type: Type.STRING },
                fixedObjectsProps: { type: Type.STRING },
              },
              required: ['takeNumber', 'timeRange', 'actName', 'spokenLine', 'videoShotPrompt', 'soundFxCue', 'fixedSceneContext', 'fixedObjectsProps'],
            },
          },
        },
        required: ['title', 'subtitle', 'country', 'cuisineType', 'servings', 'prepTimeMinutes', 'cookTimeMinutes', 'totalTimeDisplay', 'freshIngredients', 'steps', 'masterSecret', 'prompts'],
      },
    });

    const ai = new GoogleGenAI({ apiKey });
    let response: any = null;
    let lastError: any = null;

    for (const model of MODELS) {
      try {
        response = await ai.models.generateContent({ model, contents: promptText, config: buildConfig() as any });
        if (response?.text) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response?.text) {
      throw lastError || new Error('Falha ao gerar a receita.');
    }

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating recipe with Gemini:', error);
    return res.status(500).json({
      error: 'Nao foi possivel gerar a receita com a IA no momento.',
      details: error?.message || 'Erro desconhecido',
    });
  }
}
