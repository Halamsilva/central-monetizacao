import 'dotenv/config';
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp, isFirebaseAdminConfigured } from '../api/_firebase.js';

dotenv.config({ path: '.env.local' });

const tables = [
  'profiles', 'agents', 'announcements', 'notifications', 'downloads_items',
  'facebook_items', 'tiktok_shop_items', 'youtube_items', 'viral_prompts',
  'shop_products', 'tutorials', 'kiwify_purchases', 'app_settings',
  'agent_deleted_backups', 'tools_items',
] as const;

const sourceUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const directoryFlag = process.argv.indexOf('--from-dir');
const csvDirectory = directoryFlag >= 0 ? process.argv[directoryFlag + 1] : null;
if (directoryFlag >= 0 && (!csvDirectory || csvDirectory.startsWith('--'))) {
  throw new Error('Informe a pasta dos CSVs apos --from-dir.');
}
if (!csvDirectory && (!sourceUrl || !sourceKey)) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou use --from-dir.');
}
const source = csvDirectory ? null : createClient(sourceUrl!, sourceKey!, { auth: { persistSession: false } });
const apply = process.argv.includes('--apply');
if (apply && !isFirebaseAdminConfigured()) throw new Error('Configure FIREBASE_SERVICE_ACCOUNT_JSON.');
const destination = apply ? getFirestore(getAdminApp()) : null;
const auth = apply ? getAuth(getAdminApp()) : null;

const readRows = async (table: string) => {
  if (csvDirectory) {
    const file = join(csvDirectory, `${table}_rows.csv`);
    if (!existsSync(file)) return [];
    const booleanFields = new Set(['is_admin', 'ai_accounts_access', 'featured', 'is_published', 'is_read', 'is_active', 'is_featured']);
    const jsonFields = new Set(['raw_payload', 'agent_snapshot']);
    return parse(readFileSync(file), {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      cast: (value: string, context: { column?: string | number }) => {
        if (!context.column || typeof context.column !== 'string') return value;
        if (value === '') return null;
        if (booleanFields.has(context.column)) return value.toLowerCase() === 'true';
        if (jsonFields.has(context.column)) return JSON.parse(value);
        return value;
      },
    }) as Record<string, any>[];
  }
  const rows: Record<string, any>[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await source!.from(table).select('*').range(start, start + 499);
    if (error?.code === '42P01' || error?.code === 'PGRST205') {
      console.log(`${table}: tabela ausente na origem`);
      return rows;
    }
    if (error) throw new Error(`Falha ao ler ${table}: ${error.message || error.code || 'acesso negado'}`);
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
};

const byEmail = new Map<string, string>();
const seenIds = new Map<string, Set<string>>();

for (const table of tables) {
  const rows = await readRows(table);
  for (const row of rows) {
    if (!row.id && table !== 'app_settings') throw new Error(`${table}: registro sem id.`);
    const id = String(row.id || row.key);
    const seen = seenIds.get(table) || new Set<string>();
    if (seen.has(id)) throw new Error(`${table}: id duplicado no arquivo.`);
    seen.add(id);
    seenIds.set(table, seen);
  }
  console.log(`${table}: ${rows.length} registro(s)`);
  if (!apply || !destination || !auth) continue;

  for (const row of rows) {
    let id = String(row.id || row.email || row.key || '');
    if (table === 'profiles') {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email) throw new Error('Perfil sem e-mail; importacao interrompida.');
      let existing;
      try { existing = await auth.getUserByEmail(email); }
      catch (error: any) {
        if (error?.code !== 'auth/user-not-found') throw error;
      }
      if (!existing) {
        existing = await auth.createUser({
          uid: id,
          email,
          password: randomBytes(36).toString('base64url'),
          displayName: row.full_name || undefined,
          emailVerified: false,
        });
      }
      id = existing.uid;
      byEmail.set(email, id);
    } else if (table === 'app_settings') {
      id = String(row.key || '');
    }
    if (!id) throw new Error(`Registro sem identificador em ${table}; importacao interrompida.`);
    await destination.collection(table).doc(id).set({ ...row, id }, { merge: true });
  }
}

console.log(apply
  ? `Importacao concluida. ${byEmail.size} conta(s) vinculada(s); senhas antigas precisam ser redefinidas.`
  : 'Conferencia concluida. Nenhum dado foi gravado.');
