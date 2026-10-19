import '@/lib/local-storage';

export function readSetting(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Sem armazenamento disponível: a preferência vale só nesta sessão.
  }
}
