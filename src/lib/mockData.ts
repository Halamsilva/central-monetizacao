import { Notice, Agent, Download, Update } from './supabase';

export const MOCK_NOTICES: Notice[] = [
  {
    id: '1',
    title: 'Bem-vindo à Nova Central!',
    content: 'Estamos felizes em anunciar a nova Central Monetização. Aqui você encontrará tudo o que precisa para escalar suas redes sociais.',
    is_pinned: true,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Nova atualização do TikTok Shop',
    content: 'O TikTok Shop acaba de mudar as regras de comissionamento. Confira as novas estratégias na aba Atualizações.',
    is_pinned: false,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    title: 'Roteirista de TikTok Shop',
    description: 'Cria roteiros altamente persuasivos para vídeos de venda de produtos no TikTok Shop.',
    prompt: 'Atue como um especialista em TikTok Shop. Seu objetivo é criar um roteiro de 30 a 60 segundos para o produto [PRODUTO]...',
    category: 'TikTok Shop',
    tag: 'NOVO',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Viralizer Reels / Shorts',
    description: 'Transforma ideias simples em ganchos virais para vídeos curtos.',
    prompt: 'Analise o seguinte assunto: [ASSUNTO]. Crie 5 opções de ganchos (hooks) que prendam a atenção nos primeiros 3 segundos...',
    category: 'IA para Conteúdo',
    tag: 'PREMIUM',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Copywriter para Facebook',
    description: 'Especialista em criar copies que não dão bloqueio e vendem muito.',
    prompt: 'Escreva uma copy para um anúncio de Facebook seguindo a estrutura AIDA...',
    category: 'Facebook Monetização',
    tag: 'EXCLUSIVO',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_DOWNLOADS: Download[] = [
  {
    id: '1',
    title: 'Checklist: Vídeo Viral',
    description: 'O passo a passo definitivo para não esquecer nada na hora de postar.',
    file_url: '#',
    category: 'Materiais',
    is_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Template de Roteiro VSL',
    description: 'Template editável para suas cartas de vendas em vídeo.',
    file_url: '#',
    category: 'Templates',
    is_published: true,
    created_at: new Date().toISOString()
  }
];

export const MOCK_UPDATES: Update[] = [
  {
    id: '1',
    title: 'Versão 2.0 da Plataforma',
    content: 'Adicionamos a biblioteca de agentes IA e novos prompts virais.',
    version: '2.0.0',
    is_published: true,
    created_at: new Date().toISOString()
  }
];
