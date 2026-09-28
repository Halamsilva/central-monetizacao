import { sendPasswordResetEmail } from '../_emails.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  if (!email) {
    return res.status(400).json({ error: 'missing_email' });
  }

  try {
    const result = await sendPasswordResetEmail(email);
    return res.status(200).json({ ok: true, sent: Boolean(result.ok && !result.skipped) });
  } catch (error: any) {
    console.error('Password reset error:', error?.message || error);
    // Always answer ok to avoid leaking whether the email exists.
    return res.status(200).json({ ok: true, sent: false });
  }
}
