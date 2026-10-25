import meninaDaRocaHandler from '../server-agents/menina-da-roca.js';
import configurableAgentHandler from '../server-agents/configurable-agent.js';
import importAgentHandler from '../server-agents/import-agent.js';
import clonagemVideoHandler from '../server-agents/clonagem-video.js';
import novelinhasHandler from '../server-agents/novelinhas.js';
import mestre30sHandler from '../server-agents/mestre30s.js';
import insetosHandler from '../server-agents/insetos.js';
import povProdutoHandler from '../server-agents/povProduto.js';
import seedanceHandler from '../server-agents/seedance.js';
import avatarScaleHandler from '../server-agents/avatarScale.js';
import receitasEbookHandler from '../server-agents/receitasEbook.js';
import encapsuladosHandler from '../server-agents/encapsulados.js';
import tiktokShopShopeeHandler from '../server-agents/tiktokShopShopee.js';
import lumina8kHandler from '../server-agents/lumina8k.js';
import reflexaoVelhoRocaHandler from '../server-agents/reflexaoVelhoRoca.js';
import plantacoesHandler from '../server-agents/plantacoes.js';
import limpezaHandler from '../server-agents/limpeza.js';
import ganchosHandler from '../server-agents/ganchos.js';
import videoStudioHandler from '../server-agents/videoStudio.js';
import flowAutomationsHandler from '../server-agents/flowAutomations.js';
import criadorNoticiasHandler from '../server-agents/criadorNoticias.js';
import clonagemProHandler from '../server-agents/clonagemPro.js';
import viralProfilesHandler from '../server-agents/viralProfiles.js';
import chatAiHandler from '../server-agents/chatAi.js';

const handlers: Record<string, (req: any, res: any) => Promise<any> | any> = {
  'menina-da-roca': meninaDaRocaHandler,
  configurable: configurableAgentHandler,
  import: importAgentHandler,
  'clonagem-video': clonagemVideoHandler,
  novelinhas: novelinhasHandler,
  mestre30s: mestre30sHandler,
  insetos: insetosHandler,
  povProduto: povProdutoHandler,
  seedance: seedanceHandler,
  avatarScale: avatarScaleHandler,
  receitasEbook: receitasEbookHandler,
  encapsulados: encapsuladosHandler,
  tiktokShopShopee: tiktokShopShopeeHandler,
  lumina8k: lumina8kHandler,
  reflexaoVelhoRoca: reflexaoVelhoRocaHandler,
  plantacoes: plantacoesHandler,
  limpeza: limpezaHandler,
  ganchos: ganchosHandler,
  'video-studio': videoStudioHandler,
  'flow-automations': flowAutomationsHandler,
  'criador-noticias': criadorNoticiasHandler,
  'clonagem-pro': clonagemProHandler,
  'perfis-virais': viralProfilesHandler,
  'chat-ia': chatAiHandler,
};

export default function handler(req: any, res: any) {
  const agentParam = req.query?.agent;
  const agent = Array.isArray(agentParam) ? agentParam[0] : agentParam;
  const selectedHandler = typeof agent === 'string' ? handlers[agent] : null;

  if (!selectedHandler) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  return selectedHandler(req, res);
}
