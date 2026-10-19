import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTabBarSpace } from '@/components/trip-tab-bar';
import { ListRow, Screen, SectionTitle, TabTitle } from '@/components/ui/layout';
import { Surface } from '@/components/ui/surface';
import { useChecklist } from '@/data/trip-content';
import { useContacts, useDocuments, useNotes } from '@/data/trip-extras';
import { useTrip, useTripMembers } from '@/data/trips';
import { useTripId } from '@/providers/trip-id';
import { useAppTheme } from '@/theme/theme-provider';

const preferenceLabel = { auto: 'Automático', light: 'Claro', dark: 'Escuro' } as const;

export default function MoreScreen() {
  const id = useTripId();
  const trip = useTrip(id);
  const members = useTripMembers(id);
  const checklist = useChecklist(id);
  const documents = useDocuments(id);
  const contacts = useContacts(id);
  const notes = useNotes(id);
  const { preference } = useAppTheme();
  const space = useTabBarSpace();
  const done = checklist.data?.filter((i) => i.done).length ?? 0;
  const go = (screen: string) => router.push(`/viagem/${id}/${screen}` as Href);
  const count = (list: unknown[] | undefined) => (list ? String(list.length) : undefined);

  return (
    <Screen bottomSpace={space.content} header={<TabTitle overline={trip.data?.name} title="Mais" />}>
      <Surface>
        <ListRow icon="search" title="Buscar na viagem" subtitle="Reservas, roteiro, gastos, anotações…" onPress={() => go('busca')} isLast />
      </Surface>

      <View style={styles.section}>
        <SectionTitle>Preparação</SectionTitle>
        <Surface>
          <ListRow
            icon="checklist"
            title="Checklist da mala"
            value={checklist.data ? `${done}/${checklist.data.length}` : undefined}
            onPress={() => go('checklist')}
          />
          <ListRow icon="document" title="Documentos" value={count(documents.data)} onPress={() => go('documentos')} isLast />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionTitle>Na viagem</SectionTitle>
        <Surface>
          <ListRow icon="map" title="Mapa da viagem" onPress={() => go('mapa')} />
          <ListRow icon="users" title="Viajantes" value={count(members.data)} onPress={() => go('viajantes')} />
          <ListRow icon="wallet" title="Câmbio" subtitle="Conversor com a cotação do dia" onPress={() => go('cambio')} />
          <ListRow icon="swap" title="Acerto de contas" subtitle="Quem deve para quem" onPress={() => go('acerto')} />
          <ListRow icon="phone" title="Contatos de emergência" value={count(contacts.data)} onPress={() => go('contatos')} />
          <ListRow icon="note" title="Anotações" value={count(notes.data)} onPress={() => go('anotacoes')} isLast />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionTitle>Viagem e app</SectionTitle>
        <Surface>
          <ListRow icon="gear" title="Configurações da viagem" onPress={() => go('configuracoes')} />
          <ListRow icon="upload" title="Exportar roteiro (PDF)" onPress={() => go('exportar')} />
          <ListRow icon="contrast" title="Aparência" value={preferenceLabel[preference]} onPress={() => router.push('/aparencia')} />
          <ListRow icon="user" title="Perfil e conta" onPress={() => router.push('/perfil')} isLast />
        </Surface>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
});
