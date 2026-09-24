import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence, createUserWithEmailAndPassword, getAuth,
  GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
  setPersistence, signInWithEmailAndPassword, signInWithPopup,
  signOut as firebaseSignOut, updatePassword, updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit as firestoreLimit,
  query, setDoc, updateDoc, where, type QueryConstraint,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAmLTXC6ESMbuK1EaMunQHvwqcrndG8pyo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'central-monetizacao-plataforma.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'central-monetizacao-plataforma',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'central-monetizacao-plataforma.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '400472322485',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:400472322485:web:2355a122fa36aaa8e529fc',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const isSupabaseConfigured = isFirebaseConfigured;
const app = getApps()[0] || initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
void setPersistence(firebaseAuth, browserLocalPersistence).catch(error => {
  console.error('Falha ao persistir a sessao Firebase:', error);
});

export interface AppUser {
  id: string;
  uid: string;
  email: string | null;
  emailVerified: boolean;
  user_metadata: { full_name?: string | null; avatar_url?: string | null };
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

const toUser = (user: FirebaseUser | null): AppUser | null => user ? ({
  id: user.uid,
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
  user_metadata: { full_name: user.displayName, avatar_url: user.photoURL },
  getIdToken: (forceRefresh?: boolean) => user.getIdToken(forceRefresh),
}) : null;

const toSession = async (user: FirebaseUser | null) => user ? ({
  user: toUser(user),
  access_token: await user.getIdToken(),
}) : null;

const makeError = (error: any) => ({
  message: String(error?.message || error || 'Erro no Firebase.'),
  code: String(error?.code || 'firebase_error'),
  details: '',
  hint: '',
});

const normalize = (value: any): any => {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
};

type QueryResult = { data: any; error: any; count?: number | null };
type Filter = { field: string; neq: boolean; value: unknown };

class FirebaseQuery implements PromiseLike<QueryResult> {
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filters: Filter[] = [];
  private sort?: { field: string; ascending: boolean };
  private maxRows?: number;
  private one?: 'single' | 'maybeSingle';
  private columns = '*';
  private countMode = false;
  private headMode = false;

  constructor(private table: string) {}
  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.columns = columns;
    this.countMode = options?.count === 'exact';
    this.headMode = Boolean(options?.head);
    return this;
  }
  insert(payload: any) { this.operation = 'insert'; this.payload = payload; return this; }
  upsert(payload: any) { return this.insert(payload); }
  update(payload: any) { this.operation = 'update'; this.payload = payload; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(field: string, value: unknown) { this.filters.push({ field, value, neq: false }); return this; }
  neq(field: string, value: unknown) { this.filters.push({ field, value, neq: true }); return this; }
  order(field: string, options?: { ascending?: boolean }) {
    this.sort = { field, ascending: options?.ascending !== false }; return this;
  }
  limit(value: number) { this.maxRows = value; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybeSingle'; return this; }

  private matches(row: Record<string, any>) {
    return this.filters.every(({ field, value, neq }) => neq ? row[field] !== value : row[field] === value);
  }

  private async rows() {
    const idFilter = this.filters.find(filter => filter.field === 'id' && !filter.neq);
    if (idFilter) {
      const snapshot = await getDoc(doc(firestore, this.table, String(idFilter.value)));
      const row = snapshot.exists() ? normalize({ id: snapshot.id, ...snapshot.data() }) : null;
      return row && this.matches(row) ? [row] : [];
    }
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'silvahalam@gmail.com').toLowerCase();
    const isOwner = firebaseAuth.currentUser?.emailVerified
      && firebaseAuth.currentUser.email?.toLowerCase() === adminEmail;
    const publishedCollections = new Set([
      'agents', 'announcements', 'facebook_items', 'tiktok_shop_items',
      'youtube_items', 'viral_prompts', 'tutorials',
    ]);
    const visibilityField = !isOwner
      ? publishedCollections.has(this.table) ? 'is_published'
        : this.table === 'shop_products' ? 'is_active' : null
      : null;
    const effectiveFilters = [...this.filters];
    if (visibilityField && !effectiveFilters.some(filter => filter.field === visibilityField)) {
      effectiveFilters.push({ field: visibilityField, value: true, neq: false });
    }
    const serverFilter = effectiveFilters.find(filter => filter.field === visibilityField)
      || effectiveFilters.find(filter => filter.field !== 'id' && !filter.neq);
    const constraints: QueryConstraint[] = serverFilter
      ? [where(serverFilter.field, '==', serverFilter.value)] : [];
    if (this.maxRows !== undefined && !this.sort && effectiveFilters.length <= (serverFilter ? 1 : 0)) {
      constraints.push(firestoreLimit(this.maxRows));
    }
    const snapshot = await getDocs(query(collection(firestore, this.table), ...constraints));
    let rows = snapshot.docs.map(item => normalize({ id: item.id, ...item.data() }))
      .filter(row => effectiveFilters.every(({ field, value, neq }) => neq ? row[field] !== value : row[field] === value));
    if (this.sort) {
      const { field, ascending } = this.sort;
      rows.sort((a, b) => (a[field] === b[field] ? 0 : a[field] > b[field] ? 1 : -1) * (ascending ? 1 : -1));
    }
    if (this.maxRows !== undefined) rows = rows.slice(0, this.maxRows);
    return rows;
  }

  private project(row: Record<string, any>) {
    const fields = this.columns.split(',').map(value => value.trim()).filter(value => /^[\w]+$/.test(value));
    if (this.columns === '*' || !fields.length) return row;
    return Object.fromEntries(fields.map(field => [field, row[field]]));
  }

  private async execute(): Promise<QueryResult> {
    try {
      if (this.operation === 'select') {
        const rows = await this.rows();
        const count = this.countMode ? rows.length : null;
        if (this.headMode) return { data: null, error: null, count };
        const data = rows.map(row => this.project(row));
        if (this.one === 'single' && data.length !== 1) return { data: null, error: makeError('Registro nao encontrado.'), count };
        if (this.one === 'maybeSingle' && data.length > 1) return { data: null, error: makeError('Mais de um registro encontrado.'), count };
        return { data: this.one ? data[0] || null : data, error: null, count };
      }

      if (this.operation === 'insert') {
        const saved = [];
        for (const source of (Array.isArray(this.payload) ? this.payload : [this.payload])) {
          const item = { ...source };
          const id = item.id ? String(item.id) : null;
          delete item.id;
          if (id) { await setDoc(doc(firestore, this.table, id), item, { merge: true }); saved.push({ id, ...item }); }
          else { const created = await addDoc(collection(firestore, this.table), item); saved.push({ id: created.id, ...item }); }
        }
        return { data: this.one ? saved[0] || null : saved, error: null, count: saved.length };
      }

      const rows = await this.rows();
      for (const row of rows) {
        const reference = doc(firestore, this.table, String(row.id));
        if (this.operation === 'delete') await deleteDoc(reference);
        else await updateDoc(reference, this.payload);
      }
      return { data: rows, error: null, count: rows.length };
    } catch (error) {
      return { data: null, error: makeError(error), count: null };
    }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    fulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(fulfilled, rejected); }
}

const auth = {
  async getSession() {
    try {
      await firebaseAuth.authStateReady();
      return { data: { session: await toSession(firebaseAuth.currentUser) }, error: null };
    }
    catch (error) { return { data: { session: null }, error: makeError(error) }; }
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async user => callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', await toSession(user)));
    return { data: { subscription: { unsubscribe } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { data: { user: toUser(result.user), session: await toSession(result.user) }, error: null };
    } catch (error) { return { data: { user: null, session: null }, error: makeError(error) }; }
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (options?.data?.full_name) await updateProfile(result.user, { displayName: options.data.full_name });
      try { await sendEmailVerification(result.user); }
      catch (error) { console.error('Nao foi possivel enviar verificacao:', error); }
      return { data: { user: toUser(result.user), session: await toSession(result.user) }, error: null };
    } catch (error) { return { data: { user: null, session: null }, error: makeError(error) }; }
  },
  async signInWithOAuth({ provider }: { provider: string; options?: any }) {
    if (provider !== 'google') return { data: null, error: makeError('Provedor nao configurado.') };
    try { const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider()); return { data: { user: toUser(result.user) }, error: null }; }
    catch (error) { return { data: null, error: makeError(error) }; }
  },
  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    try {
      void options;
      await sendPasswordResetEmail(firebaseAuth, email);
      return { data: {}, error: null };
    } catch (error) { return { data: null, error: makeError(error) }; }
  },
  async updateUser({ password }: { password: string }) {
    try {
      if (!firebaseAuth.currentUser) throw new Error('Sessao nao encontrada.');
      await updatePassword(firebaseAuth.currentUser, password);
      return { data: { user: toUser(firebaseAuth.currentUser) }, error: null };
    } catch (error) { return { data: null, error: makeError(error) }; }
  },
  async signOut() { try { await firebaseSignOut(firebaseAuth); return { error: null }; } catch (error) { return { error: makeError(error) }; } },
};

export const supabase = {
  auth,
  from: (table: string) => new FirebaseQuery(table),
  storage: { from: (_bucket?: string) => ({
    upload: async (_path?: string, _file?: unknown, _options?: unknown) => ({ data: null, error: makeError('Uploads diretos foram desativados. Use um link externo no painel.') }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
  }) },
  channel: (_name?: string) => ({ on(_event?: string, _filter?: unknown, _callback?: unknown) { return this; }, subscribe() { return this; } }),
  removeChannel: (_channel?: unknown) => undefined,
};

export interface UserProfile {
  id: string; email: string; full_name: string; avatar_url?: string | null;
  is_admin?: boolean; role?: 'admin' | 'student'; access_status?: 'pending' | 'active' | 'blocked';
  ai_accounts_access?: boolean | null; approved_at?: string | null; created_at: string;
}
export interface Notice { id: string; title: string; content: string; is_pinned: boolean; is_published: boolean; created_at: string; updated_at: string; }
export interface Agent { id: string; title: string; description: string; prompt: string; category: string; tag: 'NOVO' | 'ATUALIZADO' | 'PREMIUM' | 'EXCLUSIVO'; is_published: boolean; external_link?: string; download_link?: string; created_at: string; updated_at: string; }
export interface Tutorial { id: string; title: string; description: string; video_url: string; category: string; is_published: boolean; created_at: string; }
