export type SupabaseEnv = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}
