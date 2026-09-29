import { GoogleGenAI } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

let ai: any = null;

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

  ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  try {
    const { image, stage, contextPrompt, gender = 'auto' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Imagem e obrigatoria' });
    }

    const imageParts = String(image).split(',');
    if (imageParts.length < 2) {
      return res.status(400).json({ error: 'Formato de imagem invalido' });
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageParts[1],
      },
    };

    const genderInstruction = `
      GENDER DETECTION & STRICT ATTIRE RULES:
      1. Carefully inspect the character image to identify their gender (Female or Male).
         ${gender === 'female' ? '- MANDATORY OVERRIDE: Treat the character strictly as FEMALE / WOMAN.' : ''}
         ${gender === 'male' ? '- MANDATORY OVERRIDE: Treat the character strictly as MALE / MAN.' : ''}
         On the very first line of your response, output: [GENDER: FEMALE] or [GENDER: MALE].
      
      2. ABSOLUTE CRITICAL RULE FOR FEMALE CHARACTERS (WOMEN / GIRLS):
         - NEVER, UNDER ANY CIRCUMSTANCE, DESCRIBE A FEMALE CHARACTER AS "SHIRTLESS", "TOPLESS", OR "BARE-CHESTED".
         - For swimming pool / water scenes: The female character MUST wear an athletic swimsuit, sleek one-piece swimwear, or sports bikini that showcases her fit athletic form while remaining fully covered and modest. NEVER topless or shirtless.
         - For gym / workout scenes: She MUST wear athletic wear such as a sports bra and high-waisted workout leggings or athletic shorts, or a fitted gym t-shirt.
         - For mirror / physique progress scenes: She MUST wear a sports bra and fitness shorts, highlighting her toned abs, sculpted waist, and athletic definition. NEVER shirtless.
      
      3. RULES FOR MALE CHARACTERS:
         - Male characters can be described as shirtless in swimming pool or physique mirror scenes with swim trunks or athletic shorts, or wearing gym t-shirts/tanks.
    `;

    let prompt = '';

    if (stage === 'etapa-1') {
      prompt = `
        OBJECTIVE: Analyze the provided avatar image and generate a highly detailed prompt for an AI image generator (like Midjourney or Flux).
        
        ${genderInstruction}

        TRANSFORMATION RULE:
        The character must remain IDENTICAL in facial features, style (3D, 2D, anime, etc.), clothing style, and colors, but must be represented as heavily overweight, exactly 120kg.
        
        PHYSICAL DETAILS TO INCLUDE:
        - Large protruding belly.
        - Soft facial features with a double chin.
        - Increased volume in arms, legs, and torso.
        - Maintain the original character's identity and aesthetic.
        - Attire appropriate for their detected gender and style.
        
        OUTPUT FORMAT:
        Line 1: [GENDER: FEMALE] or [GENDER: MALE]
        Line 2+: The final English prompt string. No conversational filler or explanations.
      `;
    } else if (stage === 'etapa-2') {
      let contextInstruction = '';
      if (contextPrompt) {
        contextInstruction = `
          CONSISTENCY CONTEXT:
          Use the following prompt as the ABSOLUTE BASE for the character's physical appearance and weight to ensure continuity:
          "${contextPrompt}"
        `;
      }

      prompt = `
        OBJECTIVE: Analyze the provided avatar image and generate THREE highly detailed prompts for an AI image generator.
        
        ${genderInstruction}

        ${contextInstruction}

        SITUATION:
        The character is at a modern gym, actively training to lose weight. 
        They are still overweight (approx. 100-110kg), showing effort, sweat, and determination.
        
        CONSTRAINTS:
        - Maintain IDENTICAL facial features, style, and identity of the original character.
        - Outfit: Modern athletic gym wear suited to their gender (e.g. gym t-shirt and shorts/joggers, or sports top/t-shirt and leggings for female).
        - Environment: A high-end modern gym with workout equipment.
        - Exercises: Each of the 3 prompts must describe a different exercise (e.g. running on a treadmill, lifting dumbbells, rowing machine, etc.).
        
        OUTPUT FORMAT:
        Line 1: [GENDER: FEMALE] or [GENDER: MALE]
        Line 2+: The 3 English prompts separated by "---". No numbering or extra explanations.
      `;
    } else if (stage === 'etapa-3') {
      let contextInstruction = '';
      if (contextPrompt) {
        contextInstruction = `
          CONSISTENCY CONTEXT:
          Use the following prompt as the ABSOLUTE BASE for the character's facial features and identity to ensure continuity:
          "${contextPrompt}"
        `;
      }

      prompt = `
        OBJECTIVE: Analyze the provided avatar image and generate THREE highly detailed prompts for an AI image generator.
        
        ${genderInstruction}

        ${contextInstruction}

        SITUATION:
        The character has successfully transformed and is now lean and muscular (low body fat, defined muscles).
        
        CONSTRAINTS:
        - Maintain IDENTICAL facial features, style, and identity of the original character.
        - Physique: Lean, sculpted, visible abs, muscular shoulders and arms.
        
        PROMPT SCENARIOS:
        1. Prompt 1: The character at a modern gym, posing or working out, showing muscle definition in appropriate gym gear (if female: sports bra and leggings; if male: gym tank or athletic shorts).
        2. Prompt 2: The character at a luxurious swimming pool, showing a lean athletic body. 
           CRITICAL GENDER CHECK: 
           - IF FEMALE: Wearing a stylish athletic one-piece swimsuit or sports bikini. NEVER shirtless or topless.
           - IF MALE: Shirtless wearing swim trunks.
        3. Prompt 3: The character looking at themselves in a full-length mirror, admiring their muscular progress and defined abs (if female: sports bra and fitness shorts; if male: shirtless with athletic shorts or tank top).
        
        OUTPUT FORMAT:
        Line 1: [GENDER: FEMALE] or [GENDER: MALE]
        Line 2+: The 3 English prompts separated by "---". No numbering or extra explanations.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, { text: prompt }] },
    });

    const rawText = response.text || '';
    const genderMatch = rawText.match(/\[GENDER:\s*(FEMALE|MALE)\]/i);
    const detectedGender = genderMatch
      ? genderMatch[1].toUpperCase() === 'FEMALE' ? 'Feminino' : 'Masculino'
      : gender === 'female' ? 'Feminino' : gender === 'male' ? 'Masculino' : null;
    const cleanResult = rawText.replace(/\[GENDER:\s*(FEMALE|MALE)\]/gi, '').trim();

    return res.json({ result: cleanResult, detectedGender });
  } catch (error: any) {
    console.error('Gemini Error:', error);
    const message = error?.message || 'Erro ao processar imagem.';
    return res.status(500).json({ error: message });
  }
}
