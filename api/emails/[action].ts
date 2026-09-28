import { handleEmailRoute } from '../_emailsRouter.js';

export default async function handler(req: any, res: any) {
  return handleEmailRoute(req.query?.action, req, res);
}
