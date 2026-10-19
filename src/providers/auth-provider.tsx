import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { queryClient } from '@/data/query-client';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'apple' | 'google';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Endereço para onde o login com Apple/Google volta: tripi://auth/callback (ou a URL do site no web). */
const redirectTo = Linking.createURL('auth/callback');

/** Mensagens do Supabase traduzidas para o usuário. */
export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/already registered|already exists/i.test(message)) return 'Já existe uma conta com esse e-mail.';
  if (/password should be at least/i.test(message)) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (/rate limit|too many/i.test(message)) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (/network|fetch/i.test(message)) return 'Sem conexão com a internet. Tente de novo.';
  if (/cancel/i.test(message)) return 'Login cancelado.';
  return 'Não foi possível concluir. Tente de novo.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let currentUserId: string | undefined;
    supabase.auth.getSession().then(({ data }) => {
      currentUserId = data.session?.user.id;
      setSession(data.session);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      // Ao sair ou trocar de conta, nada do usuário anterior pode ficar em cache.
      if (next?.user.id !== currentUserId) {
        queryClient.clear();
        currentUserId = next?.user.id;
      }
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      async signUp(name, email, password) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      async signInWithProvider(provider) {
        if (Platform.OS === 'web') {
          const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
          if (error) throw error;
          return;
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') throw new Error('cancel');
        const code = new URL(result.url).searchParams.get('code');
        if (!code) throw new Error('Resposta de login sem código');
        const exchange = await supabase.auth.exchangeCodeForSession(code);
        if (exchange.error) throw exchange.error;
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  }
  return value;
}
