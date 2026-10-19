import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import type { AgendaItem } from '@/data/agenda';
import { openDirections } from '@/lib/maps';
import { useAppTheme } from '@/theme/theme-provider';

/** Botão pequeno de ação dentro de um cartão (Como chegar, Copiar código). */
export function PillButton({ icon, label, onPress, accessibilityLabel }: { icon: IconName; label: string; onPress: () => void; accessibilityLabel?: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, { backgroundColor: colors.green.bg }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={16} color={colors.green.fg} strokeWidth={2.2} />
      <AppText variant="caption" weight="bold" color={colors.green.fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Copia o código e mostra "Copiado!" por alguns segundos. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string) {
    await Clipboard.setStringAsync(text);
    setCopied(text);
    setTimeout(() => setCopied((current) => (current === text ? null : current)), 2500);
  }
  return { copied, copy };
}

/** Lista da agenda do dia: horário, o que é, onde, e atalhos para ir até lá e copiar o código da reserva. */
export function AgendaList({ tripId, items }: { tripId: string; items: AgendaItem[] }) {
  const { colors } = useAppTheme();
  const { copied, copy } = useCopy();

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <AppText variant="bodyStrong" weight="extrabold" style={styles.time}>
            {item.time || '—'}
          </AppText>
          <Surface radius={18} style={styles.card}>
            <Pressable
              onPress={() => router.push({ pathname: `/viagem/[id]/${item.edit.screen}`, params: { id: tripId, editId: item.edit.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${item.time ? item.time + ', ' : ''}${item.title}, ${item.subtitle}`}
              accessibilityHint="Toque para ver ou editar"
              style={styles.cardTop}>
              <View style={[styles.icon, { backgroundColor: colors.orange.bg }]}>
                <Icon name={item.icon} size={20} color={colors.orange.fg} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {item.title}
                </AppText>
                <AppText variant="small" tone="muted">
                  {[item.subtitle, item.place].filter(Boolean).join(' · ')}
                </AppText>
              </View>
            </Pressable>
            {(item.place || item.code) && (
              <View style={styles.actions}>
                {item.place && <PillButton icon="navigate" label="Como chegar" onPress={() => openDirections(item.place!)} accessibilityLabel={`Como chegar a ${item.place}`} />}
                {item.code && (
                  <PillButton
                    icon={copied === item.code ? 'check' : 'copy'}
                    label={copied === item.code ? 'Copiado!' : `Código ${item.code}`}
                    onPress={() => copy(item.code!)}
                    accessibilityLabel={`Copiar código ${item.code}`}
                  />
                )}
              </View>
            )}
          </Surface>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  time: { width: 50, paddingTop: 14 },
  card: { flex: 1, padding: 12, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 999 },
});
