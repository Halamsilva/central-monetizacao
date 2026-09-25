import meninaDaRocaHandler from '../server-agents/menina-da-roca.js';
import configurableAgentHandler from '../server-agents/configurable-agent.js';

const handlers: Record<string, (req: any, res: any) => Promise<any> | any> = {
  'menina-da-roca': meninaDaRocaHandler,
  configurable: configurableAgentHandler,
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
