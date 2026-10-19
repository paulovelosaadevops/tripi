import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { IconButton } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorView, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useAddChecklistItem, useChecklist, useToggleChecklistItem } from '@/data/trip-content';
import { useTripMembers } from '@/data/trips';
import { firstName } from '@/lib/format';
import type { ChecklistItem } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { FontFamily } from '@/theme/tokens';

type Filter = 'todos' | 'pendentes' | 'meus';

export default function ChecklistScreen() {
  const id = useTripId();
  const { session } = useAuth();
  const checklist = useChecklist(id);
  const members = useTripMembers(id);
  const toggle = useToggleChecklistItem(id);
  const add = useAddChecklistItem(id);
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');

  const items = checklist.data ?? [];
  const done = items.filter((i) => i.done).length;
  const together = (members.data?.length ?? 1) > 1;
  const visible = items.filter((i) => (filter === 'pendentes' ? !i.done : filter === 'meus' ? i.assigned_to === session?.user.id : true));
  const groups = new Map<string, ChecklistItem[]>();
  for (const item of visible) {
    groups.set(item.group_name, [...(groups.get(item.group_name) ?? []), item]);
  }
  const totals = (group: string) => {
    const all = items.filter((i) => i.group_name === group);
    return `${all.filter((i) => i.done).length}/${all.length}`;
  };
  const nameOf = (userId: string) =>
    userId === session?.user.id ? 'você' : firstName(members.data?.find((m) => m.user_id === userId)?.profiles?.name ?? '') || 'viajante';

  const filters = [
    { value: 'todos' as Filter, label: `Todos (${items.length})` },
    { value: 'pendentes' as Filter, label: `Faltam (${items.length - done})` },
    ...(together ? [{ value: 'meus' as Filter, label: 'Comigo' }] : []),
  ];

  const submit = () => {
    const label = draft.trim();
    if (!label) return;
    add.mutate({ label, group: 'Meus itens' });
    setDraft('');
  };
  const openItem = (params: { editId?: string; group?: string }) => router.push({ pathname: '/viagem/[id]/checklist-item', params: { id, ...params } });

  return (
    <Screen
      header={<ScreenHeader title="Checklist da mala" />}
      footer={
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="Adicionar rápido…"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Novo item"
            returnKeyType="done"
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          />
          <IconButton icon="plus" label="Adicionar item" variant="accent" onPress={submit} />
          <IconButton icon="edit" label="Novo item com detalhes" onPress={() => openItem({})} />
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
      {items.length > 0 && <ChipGroup label="Mostrar" options={filters} value={filter} onChange={setFilter} scroll />}

      {checklist.data && items.length === 0 && <EmptyState title="Lista vazia" message="Adicione o que não pode faltar na mala." />}
      {items.length > 0 && visible.length === 0 && (
        <EmptyState
          title={filter === 'pendentes' ? 'Tudo pronto!' : 'Nada com você'}
          message={filter === 'pendentes' ? 'Todos os itens já estão marcados.' : 'Nenhum item marcado para você levar.'}
        />
      )}

      {[...groups.entries()].map(([group, groupItems]) => (
        <View key={group} style={styles.group}>
          <SectionTitle
            trailing={
              <View style={styles.groupActions}>
                <AppText variant="small" weight="bold" tone="muted">
                  {totals(group)}
                </AppText>
                <Pressable
                  onPress={() => openItem({ group })}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar item em ${group}`}
                  hitSlop={10}>
                  <Icon name="plus" size={20} color={colors.accent} strokeWidth={2.4} />
                </Pressable>
              </View>
            }>
            {group}
          </SectionTitle>
          <Surface>
            {groupItems.map((item, index) => {
              const details = [item.assigned_to ? `leva: ${nameOf(item.assigned_to)}` : null, item.notes].filter(Boolean).join(' · ');
              const spoken = [item.quantity > 1 ? `${item.quantity} unidades` : null, details].filter(Boolean).join(', ');
              return (
                <View
                  key={item.id}
                  style={[styles.item, index < groupItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
                  <Pressable
                    onPress={() => toggle.mutate({ id: item.id, done: !item.done })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    accessibilityLabel={item.label}
                    hitSlop={8}
                    style={styles.check}>
                    <View
                      style={[
                        styles.box,
                        { borderColor: item.done ? colors.accent : colors.inputBorder, backgroundColor: item.done ? colors.accent : 'transparent' },
                      ]}>
                      {item.done && <Icon name="check" size={15} color={colors.onAccent} strokeWidth={3} />}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => openItem({ editId: item.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label}${spoken ? ', ' + spoken : ''}`}
                    accessibilityHint="Toque para ver detalhes e editar"
                    style={({ pressed }) => [styles.flex, styles.text, pressed && { opacity: 0.6 }]}>
                    <AppText weight="semibold" tone={item.done ? 'muted' : 'default'} style={item.done && styles.doneText}>
                      {item.label}
                      {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                    </AppText>
                    {details ? (
                      <AppText variant="caption" tone="muted" numberOfLines={2}>
                        {details}
                      </AppText>
                    ) : null}
                  </Pressable>
                  <Icon name="chevronRight" size={16} color={colors.muted} />
                </View>
              );
            })}
          </Surface>
        </View>
      ))}
      {items.length > 0 && (
        <AppText variant="caption" tone="muted" style={styles.center}>
          Toque no quadrado para marcar e no nome para ver detalhes.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  progress: { padding: 14, gap: 8 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  group: { gap: 8 },
  groupActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingRight: 14 },
  check: { paddingLeft: 16, paddingRight: 4, minHeight: 56, justifyContent: 'center' },
  text: { paddingVertical: 10, gap: 2 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
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
