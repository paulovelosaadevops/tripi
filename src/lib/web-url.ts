import * as Linking from 'expo-linking';

/** Endereço público da versão web (ex.: https://tripi.expo.app). Links de e-mail sempre apontam para ele. */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || null;

/**
 * Para onde os links de e-mail (confirmação, nova senha) levam.
 * Com a versão web publicada, o link funciona em qualquer aparelho; sem ela, volta para o app.
 */
export function emailLinkTarget(path: string): string {
  return WEB_URL ? `${WEB_URL}${path}` : Linking.createURL(path.replace(/^\//, ''));
}
