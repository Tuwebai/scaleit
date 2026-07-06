import { isSupabaseConfigured } from './supabaseClient';

export type RepositoryMode = 'mock' | 'supabase';

export function getRepositoryMode(): RepositoryMode {
  if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado.');
  return 'supabase';
}
