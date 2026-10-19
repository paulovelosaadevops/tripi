import { StyleSheet, View } from 'react-native';

import { TripiMark } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

/** Aparece quando o `.env.local` ainda não tem as chaves do Supabase. */
export function SetupNotice() {
  const { colors } = useAppTheme();
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.mark}>
        <TripiMark size={64} color={colors.accent} />
      </View>
      <AppText variant="title">Falta conectar a nuvem</AppText>
      <AppText tone="muted">
        Crie o arquivo .env.local na raiz do projeto com a URL e a chave publicável do seu projeto Supabase e reinicie o
        `npx expo start`.
      </AppText>
      <Surface style={styles.code}>
        <AppText variant="small" weight="bold">
          EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
        </AppText>
        <AppText variant="small" weight="bold">
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
        </AppText>
      </Surface>
      <AppText variant="small" tone="muted">
        O passo a passo está no README.md.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 48, gap: 16 },
  mark: { marginBottom: 8 },
  code: { padding: 16, gap: 6 },
});
