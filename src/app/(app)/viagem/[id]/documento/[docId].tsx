import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ErrorView, ListRow, Screen, ScreenHeader } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useDeleteDocument, useDocuments } from '@/data/trip-extras';
import { confirmAction } from '@/lib/confirm';
import { canKeepOffline, isOffline, keepOffline, openDocument, removeOffline } from '@/lib/document-cache';
import { formatBrazilianDate } from '@/lib/format';
import { DocumentKindLabels } from '@/lib/labels';
import { useAuth } from '@/providers/auth-provider';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';
import { closeScreen } from '@/lib/navigation';

export default function DocumentScreen() {
  const id = useTripId();
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const documents = useDocuments(id);
  const remove = useDeleteDocument(id);
  const doc = documents.data?.find((d) => d.id === docId);
  const [busy, setBusy] = useState<'open' | 'offline' | null>(null);
  // Recalcula a partir do arquivo real a cada mudança (guardar/remover).
  const [, setCacheVersion] = useState(0);
  const offline = doc ? isOffline(doc) : false;
  const [error, setError] = useState<string | null>(null);

  if (!doc) {
    return (
      <Screen header={<ScreenHeader title="Documento" />}>
        {documents.isPending ? null : <ErrorView message="Documento não encontrado." />}
      </Screen>
    );
  }

  async function run(kind: 'open' | 'offline', action: () => Promise<void>) {
    setError(null);
    setBusy(kind);
    try {
      await action();
    } catch {
      setError(kind === 'open' ? 'Não foi possível abrir. Sem internet, guarde uma cópia no aparelho antes.' : 'Não foi possível baixar.');
    } finally {
      setBusy(null);
    }
  }

  const isMine = doc.owner_id === session?.user.id;

  return (
    <Screen header={<ScreenHeader title="Documento" />}>
      <Surface variant="hero" radius={24} style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: colors.heroTrack }]}>
          <Icon name="document" size={30} color={colors.heroText} />
        </View>
        <AppText variant="heading" tone="hero" style={styles.center}>
          {doc.name}
        </AppText>
        <AppText variant="small" tone="heroMuted">
          {DocumentKindLabels[doc.kind]} · {doc.visibility === 'pessoal' ? 'só seu' : 'da viagem'}
        </AppText>
      </Surface>

      <Surface>
        <ListRow title="Validade" value={doc.expires_on ? formatBrazilianDate(doc.expires_on) : 'Não informada'} />
        <ListRow title="Adicionado em" value={formatBrazilianDate(doc.created_at.slice(0, 10))} />
        <ListRow title="No aparelho" value={canKeepOffline ? (offline ? 'Sim, abre sem internet' : 'Não') : 'Só na nuvem'} isLast />
      </Surface>

      {error && (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      )}
      <Button label="Abrir" icon="document" loading={busy === 'open'} onPress={() => run('open', () => openDocument(doc))} />
      {canKeepOffline &&
        (offline ? (
          <Button
            label="Remover cópia do aparelho"
            variant="secondary"
            onPress={() => {
              removeOffline(doc);
              setCacheVersion((v) => v + 1);
            }}
          />
        ) : (
          <Button
            label="Guardar no aparelho"
            variant="secondary"
            icon="cloud"
            loading={busy === 'offline'}
            onPress={() =>
              run('offline', async () => {
                await keepOffline(doc);
                setCacheVersion((v) => v + 1);
              })
            }
          />
        ))}
      {isMine && (
        <Button
          label="Excluir documento"
          variant="danger"
          loading={remove.isPending}
          onPress={async () => {
            if (!(await confirmAction('Excluir documento?', `${doc.name} será apagado da nuvem para todos.`, 'Excluir'))) return;
            removeOffline(doc);
            await remove.mutateAsync(doc);
            closeScreen({ pathname: '/viagem/[id]', params: { id } });
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  hero: { alignItems: 'center', gap: 8, padding: 22 },
  icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
