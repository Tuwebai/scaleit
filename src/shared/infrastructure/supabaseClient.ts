import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '../config/supabaseEnv';
import type { Database } from './supabaseDatabase';

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env.isConfigured) return null;

  client ??= createClient<Database>(env.url, env.anonKey);
  return client;
}

export function isSupabaseConfigured() {
  return getSupabaseEnv().isConfigured;
}
