/* Tripi — service worker: o app abre sem internet.
 *
 * - Página (navegação): tenta a rede; sem conexão, entrega a última versão guardada.
 * - Arquivos do app (/_expo/static, /assets, ícones): têm nome com hash, então vêm do cache quando já existem.
 * - Supabase, câmbio e outros domínios: passam direto (os dados offline ficam no cache do próprio app).
 */
const CACHE = 'tripi-app-v1';
const MAX_FILES = 120;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

/** A página manda a lista do que já baixou antes de o service worker assumir. */
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls') return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const url of event.data.urls) {
        if (await cache.match(url)) continue;
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch {
          // Sem conexão agora: fica para a próxima.
        }
      }
    })(),
  );
});

async function trim(cache) {
  // A página principal ("/") nunca sai do cache; os arquivos mais antigos saem primeiro.
  const entries = (await cache.keys()).filter((request) => new URL(request.url).pathname !== '/');
  for (const request of entries.slice(0, Math.max(0, entries.length - MAX_FILES))) {
    await cache.delete(request);
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Todas as rotas usam o mesmo index.html (site de página única).
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put('/', response.clone());
          return response;
        } catch {
          return (await cache.match('/')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
        trim(cache);
      }
      return response;
    })(),
  );
});
