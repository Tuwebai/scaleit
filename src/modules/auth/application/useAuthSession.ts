import { useEffect, useState } from 'react';
import type { AuthUser } from '../domain/authUser';
import { getCurrentAuthUser, onAuthUserChange } from '../infrastructure/authService';
import { isSupabaseConfigured } from '../../../shared/infrastructure/supabaseClient';

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const isAuthEnabled = isSupabaseConfigured();

  useEffect(() => {
    if (!isAuthEnabled) return;

    let mounted = true;

    getCurrentAuthUser()
      .then((currentUser) => {
        if (mounted) setUser(currentUser);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const unsubscribe = onAuthUserChange((nextUser) => {
      if (mounted) setUser(nextUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isAuthEnabled]);

  return {
    isAuthEnabled,
    isLoading,
    user,
  };
}
