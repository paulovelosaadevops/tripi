/**
 * Notificações no celular: nesta versão os lembretes chegam pela versão web instalada na Tela de Início
 * (Web Push, gratuito). No app nativo eles exigiriam a distribuição pela loja/TestFlight (ver push.web.ts).
 */
export type PushStatus = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';

export async function pushStatus(): Promise<PushStatus> {
  return 'unsupported';
}

export async function enablePush(): Promise<void> {
  throw new Error('unsupported');
}

export async function disablePush(): Promise<void> {}
