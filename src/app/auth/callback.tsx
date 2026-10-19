import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { LoadingView } from '@/components/ui/layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

/** Volta do login com Google/Apple no navegador: troca o código do endereço pela sessão. */
export default function AuthCallback() {
  const { session } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' && !started.current) {
      started.current = true;
      const code = new URL(globalThis.location.href).searchParams.get('code');
      if (code) supabase.auth.exchangeCodeForSession(code);
    }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (session) return <Redirect href="/" />;
  if (timedOut) return <Redirect href="/login" />;
  return <LoadingView />;
}
