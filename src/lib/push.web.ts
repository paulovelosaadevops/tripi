import { supabase } from '@/lib/supabase';

/**
 * Web Push (gratuito): o navegador cria uma "inscrição" com o serviço de notificações dele e o Tripi guarda
 * em push_subscriptions; a função `lembretes` do Supabase usa isso para avisar.
 * No iPhone (iOS 16.4+), só funciona com o Tripi adicionado à Tela de Início e aberto por lá.
 */
export type PushStatus = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';

const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

function keyBytes(base64url: string) {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function registration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function pushStatus(): Promise<PushStatus> {
  if (!publicKey || typeof window === 'undefined' || !('Notification' in window)) {
    return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported';
  }
  if (isIOS() && !isStandalone()) return 'needs-install';
  const reg = await registration();
  if (!reg || !('pushManager' in reg)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const subscription = await reg.pushManager.getSubscription();
  return subscription && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Pede permissão (precisa vir de um toque do usuário) e registra este aparelho. */
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'denied' : 'dismissed');
  const reg = (await registration()) ?? (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  const subscribe = () => reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const { data } = await supabase.auth.getUser();
  const save = async (subscription: PushSubscription) => {
    const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    return supabase.from('push_subscriptions').upsert({
      endpoint: json.endpoint,
      user_id: data.user?.id,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };
  const existing = await reg.pushManager.getSubscription();
  let { error } = await save(existing ?? (await subscribe()));
  if (error && existing) {
    // A inscrição deste navegador ficou registrada por outra conta (troca de usuário): cria uma nova.
    await existing.unsubscribe();
    ({ error } = await save(await subscribe()));
  }
  if (error) throw new Error(error.message);
}

export async function disablePush(): Promise<void> {
  const reg = await registration();
  const subscription = await reg?.pushManager.getSubscription();
  if (!subscription) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}
