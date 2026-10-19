import { Platform } from 'react-native';

/**
 * Logins sociais ligados no Supabase (Authentication → Providers), listados em
 * EXPO_PUBLIC_AUTH_PROVIDERS, ex.: "google,apple". Sem a variável, só e-mail e senha.
 */
const enabled = new Set(
  (process.env.EXPO_PUBLIC_AUTH_PROVIDERS ?? '')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean),
);

export const showGoogleLogin = enabled.has('google');
/** Login com Apple só no iPhone. */
export const showAppleLogin = enabled.has('apple') && Platform.OS === 'ios';
export const hasSocialLogin = showGoogleLogin || showAppleLogin;
