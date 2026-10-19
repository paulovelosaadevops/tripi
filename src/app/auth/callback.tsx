import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingView } from '@/components/ui/layout';
import { useAuth } from '@/providers/auth-provider';

/** Volta do login com Apple/Google e dos links de e-mail; a sessão é lida pelo Supabase. */
export default function AuthCallback() {
  const { session } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (session) return <Redirect href="/" />;
  if (timedOut) return <Redirect href="/login" />;
  return <LoadingView />;
}
