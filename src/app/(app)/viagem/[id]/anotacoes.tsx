import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/chip';
import { EmptyState, ErrorView, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useTripMembers } from '@/data/trips';
import { useNotes } from '@/data/trip-extras';
import { firstName, formatDayMonth } from '@/lib/format';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

export default function NotesScreen() {
  const id = useTripId();
  const notes = useNotes(id);
  const members = useTripMembers(id);
  const { colors } = useAppTheme();
  const authorName = (userId: string) => firstName(members.data?.find((m) => m.user_id === userId)?.profiles?.name ?? '') || 'Alguém';
  const open = (noteId?: string) => router.push({ pathname: '/viagem/[id]/anotacao', params: noteId ? { id, noteId } : { id } });

  return (
    <Screen header={<ScreenHeader title="Anotações" />} footer={<Button label="Nova anotação" icon="plus" onPress={() => open()} />}>
      <AppText variant="small" tone="muted">
        Compartilhadas com todos os viajantes: Wi-Fi, endereços, dicas, frases úteis.
      </AppText>
      {notes.isPending && <SkeletonBlock height={140} radius={20} />}
      {notes.isError && <ErrorView message="Não conseguimos carregar as anotações." onRetry={() => notes.refetch()} />}
      {notes.data?.length === 0 && <EmptyState title="Nenhuma anotação ainda" message="Anote o que todo mundo precisa saber na viagem." />}
      {notes.data?.map((note) => (
        <Pressable key={note.id} onPress={() => open(note.id)} accessibilityRole="button" accessibilityLabel={note.title || 'Anotação'}>
          {({ pressed }) => (
            <Surface style={[styles.card, pressed && styles.pressed]}>
              <View style={styles.top}>
                <AppText variant="bodyStrong" weight="extrabold" style={styles.flex} numberOfLines={1}>
                  {note.title || 'Sem título'}
                </AppText>
                {note.tag && <Tag label={note.tag} bg={colors.purple.bg} fg={colors.purple.fg} />}
              </View>
              {note.body.length > 0 && (
                <AppText numberOfLines={4} style={styles.body}>
                  {note.body}
                </AppText>
              )}
              <AppText variant="caption" tone="muted">
                {authorName(note.created_by)} · {formatDayMonth(note.updated_at.slice(0, 10))}
              </AppText>
            </Surface>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  card: { padding: 16, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { lineHeight: 22 },
});
