import type { AuthUser } from '../domain/authUser';
import { getSupabaseClient } from '../../../shared/infrastructure/supabaseClient';

export type AuthStateListener = (user: AuthUser | null) => void;

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
  };
}

export function onAuthUserChange(listener: AuthStateListener) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithLogin(identifier: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase no está configurado.');

  const login = identifier.trim();
  const email = login.includes('@') ? login : await resolveEmailFromUsername(login);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function resolveEmailFromUsername(username: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase no está configurado.');

  const { data, error } = await (supabase as any).rpc('resolve_login_email', { login_identifier: username });
  if (error) throw error;
  if (!data) throw new Error('Usuario no encontrado.');
  return data;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
