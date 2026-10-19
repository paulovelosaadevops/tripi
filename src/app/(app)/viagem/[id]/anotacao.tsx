import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { commit } from '@/data/offline';
import { useDeleteNote, useNotes, useSaveNote } from '@/data/trip-extras';
import { confirmAction } from '@/lib/confirm';
import { useTripId } from '@/providers/trip-id';
import { closeScreen } from '@/lib/navigation';

/** Cria (sem noteId) ou edita uma anotação. */
export default function NoteEditorScreen() {
  const id = useTripId();
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const notes = useNotes(id);
  const save = useSaveNote(id);
  const remove = useDeleteNote(id);
  const existing = noteId ? notes.data?.find((n) => n.id === noteId) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [tag, setTag] = useState(existing?.tag ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() && !body.trim()) return setError('Escreva um título ou um texto.');
    setError(null);
    try {
      await commit(save, { id: noteId, title: title.trim(), body: body.trim(), tag: tag.trim() || null });
      closeScreen({ pathname: '/viagem/[id]', params: { id } });
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  }

  return (
    <Screen
      modal
      header={<ScreenHeader title={noteId ? 'Editar anotação' : 'Nova anotação'} leading="close" />}
      footer={
        <>
          {error && (
            <AppText variant="small" tone="danger">
              {error}
            </AppText>
          )}
          <Button label="Salvar" loading={save.isPending} onPress={submit} />
          {noteId && (
            <Button
              label="Excluir anotação"
              variant="danger"
              size="medium"
              loading={remove.isPending}
              onPress={async () => {
                if (!(await confirmAction('Excluir anotação?', 'Ela some para todos os viajantes.', 'Excluir'))) return;
                await commit(remove, { id: noteId });
                closeScreen({ pathname: '/viagem/[id]', params: { id } });
              }}
            />
          )}
        </>
      }>
      <TextField label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Wi-Fi do apartamento" autoFocus={!noteId} />
      <TextField label="Texto" value={body} onChangeText={setBody} placeholder="Escreva aqui…" multiline style={{ minHeight: 200 }} />
      <TextField label="Etiqueta (opcional)" value={tag} onChangeText={setTag} placeholder="Ex.: Lisboa, Dica" maxLength={24} />
    </Screen>
  );
}
