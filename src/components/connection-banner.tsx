import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useIsOnline, usePendingChanges } from '@/data/offline';
import { useAppTheme } from '@/theme/theme-provider';

/** Faixa discreta no topo: sem internet, ou enviando o que ficou na fila. Some quando está tudo em dia. */
export function ConnectionBanner() {
  const online = useIsOnline();
  const pending = usePendingChanges();
  const { colors } = useAppTheme();
  if (online && pending === 0) return null;

  const changes = pending === 1 ? '1 alteração' : `${pending} alterações`;
  const text = online
    ? `Enviando ${changes}…`
    : pending > 0
      ? `Sem conexão · ${changes} na fila, enviamos quando a internet voltar`
      : 'Sem conexão · mostrando o que está salvo no aparelho';

  return (
    <View
      style={[styles.banner, { backgroundColor: online ? colors.green.bg : colors.orange.bg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Icon name="cloud" size={16} color={online ? colors.green.fg : colors.orange.fg} strokeWidth={2.2} />
      <AppText variant="caption" weight="bold" color={online ? colors.green.fg : colors.orange.fg} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  text: { flex: 1 },
});
