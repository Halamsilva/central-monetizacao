import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Query, type DocumentData } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'central-monetizacao-plataforma';

export const isFirebaseAdminConfigured = () => Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

export const getAdminApp = () => {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const serviceAccount = JSON.parse(raw);
    return initializeApp({ credential: cert(serviceAccount), projectId });
  }
  return initializeApp({ projectId });
};

const toUser = (user: any) => user ? ({
  id: user.uid,
  email: user.email || null,
  email_verified: user.emailVerified === true,
  email_confirmed_at: user.emailVerified ? user.metadata?.creationTime : null,
  app_metadata: user.customClaims || {},
  user_metadata: { full_name: user.displayName || null, avatar_url: user.photoURL || null },
}) : null;

export const isVerifiedOwner = (user: any) => user?.email_verified === true
  && user.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'silvahalam@gmail.com').toLowerCase();

type Result = { data: any; error: any; count?: number | null };
type Filter = { field: string; value: unknown; not: boolean };

class FirestoreTable implements PromiseLike<Result> {
  private mode: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private payload: any;
  private filters: Filter[] = [];
  private sort?: { field: string; ascending: boolean };
  private maxRows?: number;
  private one?: 'single' | 'maybeSingle';
  private columns = '*';
  private countMode = false;
  private headMode = false;
  private conflict?: string;

  constructor(private table: string) {}
  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.columns = columns;
    this.countMode = options?.count === 'exact';
    this.headMode = Boolean(options?.head);
    return this;
  }
  insert(payload: any) { this.mode = 'insert'; this.payload = payload; return this; }
  upsert(payload: any, options?: { onConflict?: string }) {
    this.mode = 'upsert'; this.payload = payload; this.conflict = options?.onConflict; return this;
  }
  update(payload: any) { this.mode = 'update'; this.payload = payload; return this; }
  delete() { this.mode = 'delete'; return this; }
  eq(field: string, value: unknown) { this.filters.push({ field, value, not: false }); return this; }
  neq(field: string, value: unknown) { this.filters.push({ field, value, not: true }); return this; }
  order(field: string, options?: { ascending?: boolean }) {
    this.sort = { field, ascending: options?.ascending !== false }; return this;
  }
  limit(value: number) { this.maxRows = value; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybeSingle'; return this; }

  private async references() {
    const db = getFirestore(getAdminApp());
    const id = this.filters.find(filter => filter.field === 'id' && !filter.not);
    if (id) {
      const ref = db.collection(this.table).doc(String(id.value));
      const snapshot = await ref.get();
      return snapshot.exists ? [snapshot] : [];
    }
    let query: Query<DocumentData> = db.collection(this.table);
    const firstEquality = this.filters.find(filter => !filter.not);
    if (firstEquality) query = query.where(firstEquality.field, '==', firstEquality.value);
    let snapshots = (await query.get()).docs.filter(snapshot =>
      this.filters.every(filter => {
        const value = snapshot.get(filter.field);
        return filter.not ? value !== filter.value : value === filter.value;
      }),
    );
    if (this.sort) {
      const { field, ascending } = this.sort;
      snapshots = snapshots.sort((left, right) => {
        const a = left.get(field);
        const b = right.get(field);
        return (a === b ? 0 : a > b ? 1 : -1) * (ascending ? 1 : -1);
      });
    }
    if (this.maxRows !== undefined) snapshots = snapshots.slice(0, this.maxRows);
    return snapshots;
  }

  private project(row: Record<string, any>) {
    if (this.columns === '*') return row;
    const names = this.columns.split(',').map(value => value.trim()).filter(value => /^\w+$/.test(value));
    return Object.fromEntries(names.map(name => [name, row[name]]));
  }

  private async execute(): Promise<Result> {
    try {
      const db = getFirestore(getAdminApp());
      if (this.mode === 'insert' || this.mode === 'upsert') {
        const saved = [];
        for (const source of (Array.isArray(this.payload) ? this.payload : [this.payload])) {
          const item = { ...source };
          const collection = db.collection(this.table);
          const key = item.id || (this.table === 'app_settings' ? item.key : null);
          let ref = key ? collection.doc(String(key)) : collection.doc();
          if (this.mode === 'upsert' && this.conflict && item[this.conflict] != null && !item.id) {
            const existing = await collection.where(this.conflict, '==', item[this.conflict]).limit(2).get();
            if (existing.size > 1) throw new Error('Chave de conflito duplicada.');
            if (!existing.empty) ref = existing.docs[0].ref;
          }
          if (this.mode === 'insert' && (await ref.get()).exists) throw new Error('Registro ja existe.');
          await ref.set({ ...item, id: ref.id }, { merge: this.mode === 'upsert' });
          saved.push({ ...item, id: ref.id });
        }
        return { data: this.one ? saved[0] || null : saved, error: null, count: saved.length };
      }
      const snapshots = await this.references();
      if (this.mode === 'update' || this.mode === 'delete') {
        for (const snapshot of snapshots) {
          if (this.mode === 'delete') await snapshot.ref.delete();
          else await snapshot.ref.update(this.payload);
        }
      }
      const rows = snapshots.map(snapshot => ({ ...snapshot.data(), id: snapshot.id }));
      const count = this.countMode ? rows.length : null;
      if (this.headMode) return { data: null, error: null, count };
      if (this.one === 'single' && rows.length !== 1) return { data: null, error: new Error('Registro nao encontrado.'), count };
      if (this.one === 'maybeSingle' && rows.length > 1) return { data: null, error: new Error('Mais de um registro encontrado.'), count };
      const data = rows.map(row => this.project(row));
      return { data: this.one ? data[0] || null : data, error: null, count };
    } catch (error) { return { data: null, error, count: null }; }
  }

  then<TResult1 = Result, TResult2 = never>(
    fulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(fulfilled, rejected); }
}

export const createServiceClient = () => ({
  from: (table: string) => new FirestoreTable(table),
  auth: {
    async getUser(token: string) {
      try {
        const decoded = await getAuth(getAdminApp()).verifyIdToken(token, true);
        const user = await getAuth(getAdminApp()).getUser(decoded.uid);
        return { data: { user: toUser(user) }, error: null };
      } catch (error) { return { data: { user: null }, error }; }
    },
    admin: {
      async getUserById(uid: string) {
        try { return { data: { user: toUser(await getAuth(getAdminApp()).getUser(uid)) }, error: null }; }
        catch (error) { return { data: { user: null }, error }; }
      },
      async updateUserById(uid: string, changes: { app_metadata?: Record<string, unknown> }) {
        try {
          if (changes.app_metadata) await getAuth(getAdminApp()).setCustomUserClaims(uid, changes.app_metadata);
          return { data: { user: toUser(await getAuth(getAdminApp()).getUser(uid)) }, error: null };
        } catch (error) { return { data: { user: null }, error }; }
      },
      async listUsers({ page = 1, perPage = 1000 }: { page?: number; perPage?: number } = {}) {
        try {
          let token: string | undefined;
          let result;
          for (let index = 0; index < page; index++) {
            result = await getAuth(getAdminApp()).listUsers(perPage, token);
            token = result.pageToken;
            if (!token) break;
          }
          return { data: { users: result?.users.map(toUser) || [] }, error: null };
        } catch (error) { return { data: { users: [] }, error }; }
      },
    },
  },
});
