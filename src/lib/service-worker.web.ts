/**
 * Registra o public/sw.js, que guarda os arquivos do app para ele abrir sem internet (inclusive quando
 * instalado na Tela de Início do iPhone). Fica de fora no modo de desenvolvimento para não prender arquivos antigos.
 */
export function registerServiceWorker() {
  if (__DEV__ || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const register = () =>
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Arquivos que esta página já baixou antes de o service worker assumir (o bundle, as fontes…).
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(location.origin));
        registration.active?.postMessage({ type: 'cache-urls', urls: [location.origin + '/', ...urls] });
      })
      .catch(() => undefined);
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
