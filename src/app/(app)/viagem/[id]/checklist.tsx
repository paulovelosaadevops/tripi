
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorView, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAddChecklistItem, useChecklist, useDeleteChecklistItem, useToggleChecklistItem } from '@/data/trip-content';
import { confirmAction } from '@/lib/confirm';
import type { ChecklistItem } from '@/lib/types';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';
import { useTripId } from '@/providers/trip-id';

export default function ChecklistScreen() {
  const id = useTripId();
  const checklist = useChecklist(id);
  const toggle = useToggleChecklistItem(id);
  const add = useAddChecklistItem(id);
  const remove = useDeleteChecklistItem(id);
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState('');

  const items = checklist.data ?? [];
  const done = items.filter((i) => i.done).length;
  const groups = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    groups.set(item.group_name, [...(groups.get(item.group_name) ?? []), item]);
  }

  const submit = () => {
    const label = draft.trim();
    if (!label) return;
    add.mutate({ label, group: 'Meus itens' });
    setDraft('');
  };

  const askDelete = async (item: ChecklistItem) => {
    if (await confirmAction('Remover item?', item.label, 'Remover')) remove.mutate(item.id);
  };

  return (
    <Screen
      header={<ScreenHeader title="Checklist da mala" />}
      footer={
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="Adicionar item…"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Novo item"
            returnKeyType="done"
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          />
          <IconButton icon="plus" label="Adicionar item" variant="accent" onPress={submit} />
        </View>
      }>
      {checklist.isPending && <SkeletonBlock height={200} radius={18} />}
      {checklist.isError && <ErrorView message="Não conseguimos carregar o checklist." onRetry={() => checklist.refetch()} />}
      {checklist.data && (
        <Surface style={styles.progress}>
          <View style={styles.progressTop}>
            <AppText variant="small" weight="bold">
              {done} de {items.length} itens prontos
            </AppText>
            <AppText variant="small" weight="bold" tone="muted">
              {items.length ? Math.round((done / items.length) * 100) : 0}%
            </AppText>
          </View>
          <ProgressBar value={items.length ? done / items.length : 0} />
        </Surface>
      )}
      {checklist.data && items.length === 0 && <EmptyState title="Lista vazia" message="Adicione o que não pode faltar na mala." />}
      {[...groups.entries()].map(([group, groupItems]) => (
        <View key={group} style={styles.group}>
          <SectionTitle>{group}</SectionTitle>
          <Surface>
            {groupItems.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => toggle.mutate({ id: item.id, done: !item.done })}
                onLongPress={() => askDelete(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.done }}
                accessibilityHint="Toque e segure para remover"
                style={[styles.item, index < groupItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                <View
                  style={[
                    styles.box,
                    { borderColor: item.done ? colors.accent : colors.inputBorder, backgroundColor: item.done ? colors.accent : 'transparent' },
                  ]}>
                  {item.done && <Icon name="check" size={15} color={colors.onAccent} strokeWidth={3} />}
                </View>
                <AppText
                  weight="semibold"
                  tone={item.done ? 'muted' : 'default'}
                  style={[styles.flex, item.done && styles.doneText]}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </Surface>
        </View>
      ))}
      <AppText variant="caption" tone="muted" style={styles.center}>
        Toque e segure um item para remover.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  progress: { padding: 14, gap: 8 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  group: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  doneText: { textDecorationLine: 'line-through' },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
