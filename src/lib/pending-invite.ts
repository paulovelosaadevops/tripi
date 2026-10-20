import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';

import '@/lib/local-storage';

/**
 * Convite aberto antes de entrar na conta: quem ainda não tem conta abre o link, é levado ao login/cadastro
 * e o convite não pode se perder no caminho. O código fica guardado no aparelho e, assim que a pessoa entra,
 * o Tripi abre o convite de novo.
 */
const KEY = 'tripi-convite-pendente';

export function inviteCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /\/convite\/([A-Za-z0-9_-]{4,64})/.exec(url);
  return match ? match[1] : null;
}

export function savePendingInvite(code: string) {
  try {
    globalThis.localStorage.setItem(KEY, code);
  } catch {
    // Sem armazenamento: o convite precisará ser aberto de novo depois de entrar.
  }
}

export function readPendingInvite(): string | null {
  try {
    return globalThis.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    globalThis.localStorage.removeItem(KEY);
  } catch {
    // nada a fazer
  }
}

const currentWebPath = () => (globalThis as { location?: { pathname?: string } }).location?.pathname;

// Web: o endereço já está disponível antes da primeira tela; guardar aqui faz o aviso no login aparecer de cara.
// Quem já está logado vê a tela do convite direto e o código pendente é descartado logo abaixo.
const initialWebCode = inviteCodeFromUrl(currentWebPath());
if (initialWebCode) savePendingInvite(initialWebCode);

/** Guarda convites abertos sem login (links no celular) e, depois do login, leva ao convite pendente. */
export function usePendingInvite(signedIn: boolean, ready: boolean) {
  useEffect(() => {
    if (signedIn) return;
    const remember = (url: string | null) => {
      const code = inviteCodeFromUrl(url);
      if (code) savePendingInvite(code);
    };
    Linking.getInitialURL().then(remember).catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => remember(url));
    return () => subscription.remove();
  }, [signedIn]);

  useEffect(() => {
    if (!ready || !signedIn) return;
    const code = readPendingInvite();
    if (!code) return;
    clearPendingInvite();
    // Já está na tela desse convite (abriu o link com a conta aberta): nada a fazer.
    if (inviteCodeFromUrl(currentWebPath()) === code) return;
    // Depois que as telas da conta montarem.
    const timer = setTimeout(() => router.push({ pathname: '/convite/[code]', params: { code } }), 0);
    return () => clearTimeout(timer);
  }, [ready, signedIn]);
}
