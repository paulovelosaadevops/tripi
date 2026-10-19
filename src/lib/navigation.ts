import { router, type Href } from 'expo-router';

/** Fecha a tela atual. Aberta direto por um link (sem tela anterior), vai para `fallback`. */
export function closeScreen(fallback: Href = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
