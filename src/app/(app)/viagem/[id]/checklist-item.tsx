import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { ErrorView, LoadingView, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { commit } from '@/data/offline';
import { useAddChecklistItem, useChecklist, useDeleteChecklistItem, useUpdateChecklistItem } from '@/data/trip-content';
import { useTripMembers } from '@/data/trips';
import { confirmAction } from '@/lib/confirm';
import { firstName } from '@/lib/format';
import { DefaultChecklist } from '@/lib/labels';
import { closeScreen } from '@/lib/navigation';
import type { ChecklistItem } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

const NEW_CATEGORY = '__nova__';
const NOBODY = '__ninguem__';

/** Item do checklist com detalhes: categoria, quantidade, quem leva e observações. Novo, ou edição com `editId`. */
export default function ChecklistItemScreen() {
  const id = useTripId();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const checklist = useChecklist(id);
  if (!editId) return <ItemForm tripId={id} items={checklist.data ?? []} />;
  if (checklist.isPending) return <LoadingView />;
  const item = checklist.data?.find((i) => i.id === editId);
  if (!item) {
    return (
      <Screen modal header={<ScreenHeader title="Item" leading="close" />}>
        <ErrorView message="Este item não existe mais." />
      </Screen>
    );
  }
  return <ItemForm tripId={id} items={checklist.data ?? []} item={item} />;
}

function ItemForm({ tripId, items, item }: { tripId: string; items: ChecklistItem[]; item?: ChecklistItem }) {
  const { group: initialGroup } = useLocalSearchParams<{ group?: string }>();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const members = useTripMembers(tripId);
  const add = useAddChecklistItem(tripId);
  const update = useUpdateChecklistItem(tripId);
  const remove = useDeleteChecklistItem(tripId);
  const editing = Boolean(item);

  // Categorias que já existem na viagem + as sugeridas, sem repetir.
  const existing = [...new Set([...items.map((i) => i.group_name), ...DefaultChecklist.map((g) => g.group), 'Meus itens'])];
  const startGroup = item?.group_name ?? initialGroup ?? 'Meus itens';

  const [label, setLabel] = useState(item?.label ?? '');
  const [group, setGroup] = useState(existing.includes(startGroup) ? startGroup : NEW_CATEGORY);
  const [newGroup, setNewGroup] = useState(existing.includes(startGroup) ? '' : startGroup);
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [assignee, setAssignee] = useState(item?.assigned_to ?? NOBODY);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [...existing.map((g) => ({ value: g, label: g })), { value: NEW_CATEGORY, label: '+ Nova categoria' }];
  const people = [
    { value: NOBODY, label: 'Ninguém em especial' },
    ...(members.data ?? []).map((m) => ({
      value: m.user_id,
      label: m.user_id === session?.user.id ? 'Eu' : firstName(m.profiles?.name ?? '') || 'Viajante',
    })),
  ];

  async function save() {
    const next: Record<string, string> = {};
    if (!label.trim()) next.label = 'Diga o que é o item.';
    const groupName = group === NEW_CATEGORY ? newGroup.trim() : group;
    if (!groupName) next.group = 'Dê um nome à nova categoria.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = {
      label: label.trim(),
      group: groupName,
      notes: notes.trim() || null,
      quantity,
      assigned_to: assignee === NOBODY ? null : assignee,
    };
    try {
      if (item) await commit(update, { id: item.id, ...input });
      else await commit(add, input);
      closeScreen({ pathname: '/viagem/[id]/checklist', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
    }
  }

  async function destroy() {
    if (!item) return;
    if (!(await confirmAction('Remover item?', item.label, 'Remover'))) return;
    try {
      await commit(remove, { id: item.id });
      closeScreen({ pathname: '/viagem/[id]/checklist', params: { id: tripId } });
    } catch {
      setErrors({ form: 'Não foi possível remover. Tente de novo.' });
    }
  }

  const stepper = (delta: number) => setQuantity((q) => Math.min(999, Math.max(1, q + delta)));

  return (
    <Screen
      modal
      header={<ScreenHeader title={editing ? 'Editar item' : 'Novo item'} leading="close" />}
      footer={
        <>
          {errors.form && (
            <AppText variant="small" tone="danger">
              {errors.form}
            </AppText>
          )}
          <Button label={editing ? 'Salvar alterações' : 'Adicionar ao checklist'} loading={add.isPending || update.isPending} onPress={save} />
          {editing && <Button label="Remover item" variant="danger" size="medium" loading={remove.isPending} onPress={destroy} />}
        </>
      }>
      <TextField label="Item" value={label} onChangeText={setLabel} placeholder="Ex.: Adaptador de tomada" error={errors.label} autoFocus={!editing} />

      <ChipGroup label="Categoria" options={categoryOptions} value={group} onChange={setGroup} />
      {group === NEW_CATEGORY && (
        <TextField label="Nome da nova categoria" value={newGroup} onChangeText={setNewGroup} placeholder="Ex.: Farmácia, Praia, Bebê" error={errors.group} />
      )}

      <View style={styles.quantity}>
        <AppText variant="small" weight="bold" tone="label" style={styles.flex}>
          Quantidade
        </AppText>
        <Surface radius={14} style={styles.stepper}>
          <StepButton icon="minus" label="Diminuir quantidade" onPress={() => stepper(-1)} disabled={quantity <= 1} color={colors.accent} />
          <AppText variant="heading" style={styles.qty} accessibilityLiveRegion="polite" accessibilityLabel={`Quantidade ${quantity}`}>
            {quantity}
          </AppText>
          <StepButton icon="plus" label="Aumentar quantidade" onPress={() => stepper(1)} color={colors.accent} />
        </Surface>
      </View>

      {people.length > 2 && <ChipGroup label="Quem leva" options={people} value={assignee} onChange={setAssignee} />}

      <TextField
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        placeholder="Ex.: tipo F (Europa), comprar no aeroporto, marca…"
        multiline
      />
    </Screen>
  );
}

function StepButton({ icon, label, onPress, disabled, color }: { icon: 'plus' | 'minus'; label: string; onPress: () => void; disabled?: boolean; color: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.step, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}>
      <Icon name={icon} size={20} color={color} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 36, textAlign: 'center' },
});
