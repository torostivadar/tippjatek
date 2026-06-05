import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseUrl.startsWith('http');

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null }, error: null }),
        signUp: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        upsert: () => Promise.resolve({ error: null }),
        insert: () => Promise.resolve({ error: null }),
      })
    } as any);
