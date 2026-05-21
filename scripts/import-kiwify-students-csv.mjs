import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Uso: node scripts/import-kiwify-students-csv.mjs caminho/arquivo.csv');
  process.exit(1);
}

const readEnv = (filePath) => {
  const entries = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;

    const key = line.slice(0, separator);
    const value = line.slice(separator + 1).replace(/^"|"$/g, '');
    entries[key] = value;
  }

  return entries;
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);

      if (row.some((value) => value.trim())) {
        rows.push(row);
      }

      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);

  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
};

const parseBrazilianDate = (value) => {
  const match = String(value || '').match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!match) return new Date();

  return new Date(
    Date.UTC(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] || 0),
      Number(match[5] || 0),
      Number(match[6] || 0)
    )
  );
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const env = readEnv('.env.local');
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL/VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const csv = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(csv);
const header = rows[0].map((column) => column.trim());
const emailIndex = header.indexOf('Email');
const dateIndex = header.indexOf('Added On');

if (emailIndex < 0) {
  console.error('Coluna Email nao encontrada no CSV.');
  process.exit(1);
}

const students = new Map();

for (const row of rows.slice(1)) {
  const email = String(row[emailIndex] || '').trim().toLowerCase();
  if (!email.includes('@')) continue;

  students.set(email, {
    email,
    paidAt: parseBrazilianDate(row[dateIndex]),
  });
}

const releaseDelayDays = Number(env.KIWIFY_RELEASE_DELAY_DAYS || 7);
const now = Date.now();
let active = 0;
let pending = 0;
let matchedProfiles = 0;

for (const student of students.values()) {
  const releaseAt = addDays(student.paidAt, releaseDelayDays);
  const status = releaseAt.getTime() <= now ? 'active' : 'pending';

  if (status === 'active') active += 1;
  if (status === 'pending') pending += 1;

  const { error: purchaseError } = await supabase.from('kiwify_purchases').upsert(
    {
      email: student.email,
      kiwify_order_id: `legacy-${student.email}`,
      product_id: 'legacy_csv_import',
      purchase_status: status,
      paid_at: student.paidAt.toISOString(),
      release_at: releaseAt.toISOString(),
      raw_payload: {
        source: 'kiwify_csv_import',
        email: student.email,
        paid_at: student.paidAt.toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (purchaseError) {
    console.error(`Erro ao salvar compra de ${student.email}: ${purchaseError.message}`);
    process.exit(1);
  }

  const { data, error: profileError } = await supabase
    .from('profiles')
    .update({
      access_status: status,
      approved_at: status === 'active' ? new Date().toISOString() : null,
    })
    .eq('email', student.email)
    .eq('role', 'student')
    .select('id');

  if (profileError) {
    console.error(`Erro ao atualizar perfil de ${student.email}: ${profileError.message}`);
    process.exit(1);
  }

  matchedProfiles += data?.length || 0;
}

console.log(
  JSON.stringify(
    {
      csvRows: rows.length - 1,
      uniqueEmails: students.size,
      active,
      pending,
      matchedProfiles,
    },
    null,
    2
  )
);
