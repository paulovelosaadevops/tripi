import '@/lib/crypto-polyfill';
import '@/lib/local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Falso até o `.env.local` ser preenchido — o app mostra um aviso em vez de quebrar. */
export const isSupabaseConfigured = Boolean(url && key);

const projectUrl = url ?? 'https://configure-o-supabase.invalid';
const projectKey = key ?? 'missing-key';

export const supabase = createClient(projectUrl, projectKey, {
  auth: {
    storage: globalThis.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Os links de volta (login social e e-mails) são tratados pelas páginas auth/callback e auth/confirmar.
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

/**
 * Cliente só para pedir o e-mail de nova senha. Usa o fluxo "implicit": o link do e-mail volta com a sessão
 * no próprio endereço, então funciona em qualquer aparelho — o PKCE só funcionaria no mesmo navegador do pedido.
 */
export const supabaseEmailLinks = createClient(projectUrl, projectKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' },
});

// Renova o token só com o app em primeiro plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
