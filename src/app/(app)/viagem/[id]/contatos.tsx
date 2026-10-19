import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { Button, IconButton } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { EmptyState, ErrorView, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useContacts, useDeleteContact, useSaveContact } from '@/data/trip-extras';
import { confirmAction } from '@/lib/confirm';
import type { Contact } from '@/lib/types';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

type Draft = { id?: string; name: string; phone: string; notes: string };
const empty: Draft = { name: '', phone: '', notes: '' };

export default function ContactsScreen() {
  const id = useTripId();
  const contacts = useContacts(id);
  const save = useSaveContact(id);
  const remove = useDeleteContact(id);
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!draft) return;
    if (!draft.name.trim()) return setError('Informe o nome.');
    setError(null);
    try {
      await save.mutateAsync({
        id: draft.id,
        name: draft.name.trim(),
        phone: draft.phone.trim() || null,
        notes: draft.notes.trim() || null,
      });
      setDraft(null);
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  }

  const call = (contact: Contact) => contact.phone && Linking.openURL(`tel:${contact.phone.replace(/[^\d+]/g, '')}`);

  return (
    <Screen
      header={<ScreenHeader title="Contatos de emergência" />}
      footer={!draft && <Button label="Adicionar contato" icon="plus" onPress={() => setDraft(empty)} />}>
      <AppText variant="small" tone="muted">
        Telefones da hospedagem, seguro viagem, consulado e quem avisar em casa. Ficam salvos com a viagem.
      </AppText>

      {draft && (
        <Surface style={styles.form}>
          <AppText variant="bodyStrong" weight="extrabold">
            {draft.id ? 'Editar contato' : 'Novo contato'}
          </AppText>
          <TextField label="Nome" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Ex.: Seguro viagem 24 h" autoFocus />
          <TextField
            label="Telefone"
            value={draft.phone}
            onChangeText={(phone) => setDraft({ ...draft, phone })}
            placeholder="+55 11 99999-9999"
            keyboardType="phone-pad"
          />
          <TextField label="Observação" value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} placeholder="Ex.: apólice, endereço" />
          {error && (
            <AppText variant="small" tone="danger">
              {error}
            </AppText>
          )}
          <View style={styles.formActions}>
            <Button label="Cancelar" variant="secondary" size="medium" style={styles.flex} onPress={() => setDraft(null)} />
            <Button label="Salvar" size="medium" style={styles.flex} loading={save.isPending} onPress={submit} />
          </View>
        </Surface>
      )}

      {contacts.isPending && <SkeletonBlock height={140} radius={20} />}
      {contacts.isError && <ErrorView message="Não conseguimos carregar os contatos." onRetry={() => contacts.refetch()} />}
      {contacts.data?.length === 0 && !draft && (
        <EmptyState title="Nenhum contato ainda" message="Adicione os números que você precisa ter à mão durante a viagem." />
      )}

      {contacts.data && contacts.data.length > 0 && (
        <Surface>
          {contacts.data.map((contact, index) => (
            <View key={contact.id} style={[styles.row, index < contacts.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
              <Pressable
                style={styles.flex}
                onPress={() => setDraft({ id: contact.id, name: contact.name, phone: contact.phone ?? '', notes: contact.notes ?? '' })}
                onLongPress={async () => {
                  if (await confirmAction('Remover contato?', contact.name, 'Remover')) remove.mutate(contact.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${contact.name}. Toque para editar, segure para remover`}>
                <AppText variant="bodyStrong" weight="extrabold">
                  {contact.name}
                </AppText>
                <AppText variant="small" tone="muted">
                  {[contact.phone, contact.notes].filter(Boolean).join(' · ') || 'Sem telefone'}
                </AppText>
              </Pressable>
              {contact.phone && <IconButton icon="phone" label={`Ligar para ${contact.name}`} variant="accent" onPress={() => call(contact)} />}
            </View>
          ))}
        </Surface>
      )}
      {contacts.data && contacts.data.length > 0 && (
        <AppText variant="caption" tone="muted" style={styles.center}>
          Toque para editar · segure para remover
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  form: { padding: 16, gap: 12 },
  formActions: { flexDirection: 'row', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 16, paddingVertical: 8 },
});
