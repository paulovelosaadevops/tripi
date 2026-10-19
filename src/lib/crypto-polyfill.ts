import * as Crypto from 'expo-crypto';

/**
 * O Hermes não tem WebCrypto. Sem isto, o Supabase cai para PKCE "plain" no login com Apple/Google
 * (aviso "WebCrypto API is not supported"). Aqui entregamos SHA-256 e números aleatórios nativos.
 */
type MinimalCrypto = {
  getRandomValues?: typeof Crypto.getRandomValues;
  subtle?: { digest: (algorithm: string | { name: string }, data: BufferSource) => Promise<ArrayBuffer> };
};

const g = globalThis as unknown as { crypto?: MinimalCrypto };
const target: MinimalCrypto = g.crypto ?? (g.crypto = {});

if (!target.getRandomValues) {
  target.getRandomValues = Crypto.getRandomValues;
}

if (!target.subtle) {
  target.subtle = {
    digest(algorithm, data) {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
      return Crypto.digest(name as Crypto.CryptoDigestAlgorithm, data);
    },
  };
}
