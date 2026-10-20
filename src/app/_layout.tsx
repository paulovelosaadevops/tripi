import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SetupNotice } from '@/components/setup-notice';
import { CACHE_BUSTER, CACHE_MAX_AGE, persister } from '@/data/offline';
import { queryClient } from '@/data/query-client';
// Registram as alterações que funcionam offline antes de a fila salva ser retomada.
import '@/data/trip-content';
import '@/data/trip-extras';
import { usePendingInvite } from '@/lib/pending-invite';
import { registerServiceWorker } from '@/lib/service-worker';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { AppThemeProvider, useAppTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();
registerServiceWorker();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          buster: CACHE_BUSTER,
          // Lista que já tem dados continua salva mesmo se a última atualização falhou (sem internet, por exemplo).
          dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.data !== undefined },
        }}
        // Alterações feitas offline numa sessão anterior seguem para a nuvem assim que houver conexão; depois,
        // tudo o que veio do aparelho é conferido com a nuvem (com internet).
        onSuccess={() => queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())}>
        <AuthProvider>
          <AppThemeProvider>
            <RootNavigator fontsLoaded={fontsLoaded} />
          </AppThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, isLoading } = useAuth();
  const { colors } = useAppTheme();
  const ready = fontsLoaded && !isLoading;
  usePendingInvite(Boolean(session), ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  if (!isSupabaseConfigured) return <SetupNotice />;

  const signedIn = Boolean(session);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="auth/confirmar" />
    </Stack>
  );
}
